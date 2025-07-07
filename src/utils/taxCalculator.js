// src/utils/taxCalculator.js

/**
 * 給与所得控除額を計算する
 * @param {number} salary 給与等の収入金額
 * @returns {number} 給与所得控除額
 */
export function getSalaryDeduction(salary) {
  if (salary <= 1625000) {
    return 550000;
  } else if (salary <= 1800000) {
    return Math.floor(salary * 0.4 - 100000);
  } else if (salary <= 3600000) {
    return Math.floor(salary * 0.3 + 80000);
  } else if (salary <= 6600000) {
    return Math.floor(salary * 0.2 + 440000);
  } else if (salary <= 8500000) {
    return Math.floor(salary * 0.1 + 1100000);
  } else {
    return 1950000;
  }
}

/**
 * 全体の税額を計算する
 * @param {object} params
 * @param {number} params.salary 給与等の収入金額
 * @param {string} params.ageCategory 年齢区分: 'none'|'under65'|'over65'
 * @param {number} params.pensionIncome 公的年金等の収入金額
 * @param {number} params.otherIncome 公的年金以外の収入金額
 * @param {number} params.miscExpenses 雑所得ブロック: 必要経費
 * @param {number} [params.blueDeduction] 青色申告特別控除額
 * @param {number} [params.socialInsurance] 社会保険料控除額
 * @param {number} [params.lifeInsurance] 生命保険料控除額
 * @param {number} [params.basicDeduction] 基礎控除額
 * @param {number} [params.spouseDeduction] 配偶者控除額
 * @param {number} [params.propertyIncomeTotal] 不動産所得ブロック: 収入金額
 * @param {number} [params.propertyExpenses] 不動産所得ブロック: 必要経費
 * @param {number} [params.businessIncome] 事業所得ブロック: 総収入金額
 * @param {number} [params.businessExpenses] 事業所得ブロック: 必要経費
 * @param {number} [params.temporaryIncomeGross] 一時所得ブロック: 総収入金額
 * @param {number} [params.temporaryIncomeExpenses] 一時所得ブロック: 必要経費
 * @returns {object} 各種計算結果
 */
export function calculateTax({
  salary,
  ageCategory = 'none',
  pensionIncome = 0,
  otherIncome = 0,
  miscExpenses = 0,
  blueDeduction = 0,
  socialInsurance = 0,
  lifeInsurance = 0,
  basicDeduction = 0,
  spouseDeduction = 0,
  propertyIncomeTotal = 0,
  propertyExpenses = 0,
  businessIncome = 0,
  businessExpenses = 0,
  temporaryIncomeGross = 0,
  temporaryIncomeExpenses = 0,
}) {
  // ① 給与所得控除
  const salaryDeduction = getSalaryDeduction(salary);
  // ② 給与所得
  const salaryIncome = Math.max(0, salary - salaryDeduction);

  // ③ 不動産所得（収入 - 経費）
  const propertyNetIncome = Math.max(0, propertyIncomeTotal - propertyExpenses);

  // ④ 事業所得（総収入 - 経費）
  const businessNetIncome = Math.max(0, businessIncome - businessExpenses);

  // ⑤ 一時所得の特別控除（収入 - 経費 のうち最大50万円）
  const rawTemporary = Math.max(0, temporaryIncomeGross - temporaryIncomeExpenses);
  const temporarySpecialDeduction = Math.min(500000, rawTemporary);
  // ⑥ 一時所得 ((収入 - 経費 - 特別控除) / 2)
  const temporaryNetIncome = Math.max(0, (rawTemporary - temporarySpecialDeduction) / 2);

  // ⑦ 公的年金控除額
  let pensionDeduction = 0;
  if (ageCategory === 'under65') {
    if (pensionIncome <= 600000) pensionDeduction = 0;
    else if (pensionIncome < 1300000) pensionDeduction = pensionIncome - 600000;
    else if (pensionIncome < 4100000) pensionDeduction = Math.floor(pensionIncome * 0.75 - 275000);
    else if (pensionIncome < 7700000) pensionDeduction = Math.floor(pensionIncome * 0.85 - 685000);
    else if (pensionIncome < 10000000) pensionDeduction = Math.floor(pensionIncome * 0.95 - 1455000);
    else pensionDeduction = pensionIncome - 1955000;
  } else if (ageCategory === 'over65') {
    if (pensionIncome <= 1100000) pensionDeduction = 0;
    else if (pensionIncome < 3300000) pensionDeduction = pensionIncome - 1100000;
    else if (pensionIncome < 4100000) pensionDeduction = Math.floor(pensionIncome * 0.75 - 275000);
    else if (pensionIncome < 7700000) pensionDeduction = Math.floor(pensionIncome * 0.85 - 685000);
    else if (pensionIncome < 10000000) pensionDeduction = Math.floor(pensionIncome * 0.95 - 1455000);
    else pensionDeduction = pensionIncome - 1955000;
  }
  // ⑧ 雑所得 (年金控除後 + その他収入 - 経費)
  const miscNetIncome = Math.max(
    0,
    (ageCategory === 'none' ? 0 : pensionIncome - pensionDeduction) + otherIncome - miscExpenses
  );

  // ⑨ 総所得（各所得合算）
  const grossIncome =
    salaryIncome +
    (ageCategory === 'none' ? 0 : pensionIncome) +
    propertyNetIncome +
    businessNetIncome +
    temporaryNetIncome +
    miscNetIncome;

  // ⑩ 合計所得金額 (青色申告特別控除差引)
  const totalIncome = Math.max(0, grossIncome - blueDeduction);

  // ⑪ 総控除額
  const totalDeductions = socialInsurance + lifeInsurance + basicDeduction + spouseDeduction;

  // ⑫ 課税所得
  const taxableIncome = Math.max(0, totalIncome - totalDeductions);

  // ⑬ 所得税
  let incomeTax = 0;
  if (taxableIncome <= 1950000) {
    incomeTax = taxableIncome * 0.05;
  } else if (taxableIncome <= 3300000) {
    incomeTax = taxableIncome * 0.1 - 97500;
  } else if (taxableIncome <= 6950000) {
    incomeTax = taxableIncome * 0.2 - 427500;
  } else {
    incomeTax = taxableIncome * 0.23 - 636000;
  }

  // ⑭ 住民税（例：一律10%）
  const residentTax = Math.floor(taxableIncome * 0.1);

  return {
    salaryDeduction: Math.floor(salaryDeduction),
    salaryIncome: Math.floor(salaryIncome),
    propertyNetIncome: Math.floor(propertyNetIncome),
    businessNetIncome: Math.floor(businessNetIncome),
    temporarySpecialDeduction: Math.floor(temporarySpecialDeduction),
    temporaryNetIncome: Math.floor(temporaryNetIncome),
    pensionDeduction: Math.floor(pensionDeduction),
    miscNetIncome: Math.floor(miscNetIncome),
    grossIncome: Math.floor(grossIncome),
    totalIncome: Math.floor(totalIncome),
    taxableIncome: Math.floor(taxableIncome),
    incomeTax: Math.floor(incomeTax),
    residentTax,
  };
}
