import React, { useState, useEffect } from 'react';

// --- ヘルパー関数群 (変更なし) ---
const calculateSalaryIncome = (revenue) => {
  if (revenue <= 0) return 0;
  if (revenue <= 1625000) return Math.max(0, revenue - 550000);
  if (revenue <= 1800000) return revenue * 0.6 - 100000;
  if (revenue <= 3600000) return revenue * 0.7 - 280000;
  if (revenue <= 6600000) return revenue * 0.8 - 640000;
  if (revenue <= 8500000) return revenue * 0.9 - 1300000;
  return revenue - 1950000;
};
const calculatePublicPensionIncome = (pensionRevenue, age, otherIncomeForPensionCalc) => {
    if (pensionRevenue <= 0) return 0;
    const isOver65 = age >= 65;
    let deduction = 0;
    if (otherIncomeForPensionCalc <= 10000000) {
        if (isOver65) { if (pensionRevenue < 3300000) deduction = 1100000; else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 275000; else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 685000; else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1455000; else deduction = 1955000; } 
        else { if (pensionRevenue < 1300000) deduction = 600000; else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 275000; else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 685000; else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1455000; else deduction = 1955000; }
    } else if (otherIncomeForPensionCalc <= 20000000) {
        if (isOver65) { if (pensionRevenue < 3300000) deduction = 1000000; else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 175000; else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 585000; else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1355000; else deduction = 1855000; } 
        else { if (pensionRevenue < 1300000) deduction = 500000; else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 175000; else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 585000; else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1355000; else deduction = 1855000; }
    } else {
        if (isOver65) { if (pensionRevenue < 3300000) deduction = 900000; else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 75000; else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 485000; else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1255000; else deduction = 1755000; } 
        else { if (pensionRevenue < 1300000) deduction = 400000; else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 75000; else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 485000; else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1255000; else deduction = 1755000; }
    }
    return Math.max(0, pensionRevenue - deduction);
};
const getBasicDeduction = (totalIncome) => { if (totalIncome <= 24000000) return 480000; if (totalIncome <= 24500000) return 320000; if (totalIncome <= 25000000) return 160000; return 0; };
const getSpouseDeduction = (spouseDeductionType, totalIncome) => { return 0; };
const getIncomeTax = (taxableIncome) => { let tax = 0; if (taxableIncome <= 1950000) tax = taxableIncome * 0.05; else if (taxableIncome <= 3300000) tax = taxableIncome * 0.1 - 97500; else if (taxableIncome <= 6950000) tax = taxableIncome * 0.2 - 427500; else if (taxableIncome <= 9000000) tax = taxableIncome * 0.23 - 636000; else if (taxableIncome <= 18000000) tax = taxableIncome * 0.33 - 1536000; else if (taxableIncome <= 40000000) tax = taxableIncome * 0.4 - 2796000; else tax = taxableIncome * 0.45 - 4796000; const specialTax = tax * 0.021; return Math.floor(tax + specialTax); };
const getResidentTax = (taxableIncome) => { if (taxableIncome <= 0) return 0; const incomeProportional = taxableIncome * 0.1; return Math.floor(incomeProportional + 5000); };
const calculateTax = ({ totalIncome, socialInsuranceDeduction, lifeInsuranceDeduction, spouseDeduction }) => { const basicDeduction = getBasicDeduction(totalIncome); const spouseDeductionAmount = getSpouseDeduction(spouseDeduction, totalIncome); const totalDeductions = basicDeduction + spouseDeductionAmount + Number(socialInsuranceDeduction) + Number(lifeInsuranceDeduction); let taxableIncome = Math.floor(Math.max(0, totalIncome - totalDeductions) / 1000) * 1000; const incomeTax = getIncomeTax(taxableIncome); const residentTax = getResidentTax(taxableIncome); return { incomeTax, residentTax, taxableIncome }; };
const formatNumber = (num) => Number(num || 0).toLocaleString();

// --- 画面コンポーネント ---

// 1. 所得計算画面
const IncomePage = ({ values, incomes, handleChange, onNavigate }) => {
  const pensionEnabled = values.ageCategory !== 'none';
  return (
    <div className="md:col-span-2 space-y-6">
      {/* 各所得ブロック */}
      <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">給与所得の計算</legend><div><label htmlFor="salaryRevenue" className="block text-sm font-medium text-gray-700">給与収入 (円)</label><input id="salaryRevenue" name="salaryRevenue" type="text" value={formatNumber(values.salaryRevenue)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="salaryDeduction" className="block text-sm font-medium text-gray-700">給与所得控除 (円)</label><input id="salaryDeduction" name="salaryDeduction" type="text" value={formatNumber(incomes.salaryDeduction)} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div><div><label htmlFor="salaryIncome" className="block text-sm font-medium text-gray-700">給与所得 (円)</label><input id="salaryIncome" name="salaryIncome" type="text" value={formatNumber(incomes.salary)} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div></fieldset></div>
      <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">不動産所得の計算</legend><div><label htmlFor="realEstateRevenue" className="block text-sm font-medium text-gray-700">収入金額 (円)</label><input id="realEstateRevenue" name="realEstateRevenue" type="text" value={formatNumber(values.realEstateRevenue)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="realEstateExpenses" className="block text-sm font-medium text-gray-700">必要経費（利子含む） (円)</label><input id="realEstateExpenses" name="realEstateExpenses" type="text" value={formatNumber(values.realEstateExpenses)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="realEstateInterest" className="block text-sm font-medium text-gray-700">必要経費のうち、土地等にかかる利子分 (円)</label><input id="realEstateInterest" name="realEstateInterest" type="text" value={formatNumber(values.realEstateInterest)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="propertyNet" className="block text-sm font-medium text-gray-700">青色申告特別控除前の不動産所得 (円)</label><input id="propertyNet" name="propertyNet" type="text" value={formatNumber(incomes.realEstate)} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div></fieldset></div>
      <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">事業所得の計算</legend><div><label htmlFor="businessRevenue" className="block text-sm font-medium text-gray-700">総収入金額 (円)</label><input id="businessRevenue" name="businessRevenue" type="text" value={formatNumber(values.businessRevenue)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="businessExpenses" className="block text-sm font-medium text-gray-700">必要経費 (円)</label><input id="businessExpenses" name="businessExpenses" type="text" value={formatNumber(values.businessExpenses)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="businessNet" className="block text-sm font-medium text-gray-700">青色申告特別控除前の事業所得 (円)</label><input id="businessNet" name="businessNet" type="text" value={formatNumber(incomes.business)} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div></fieldset></div>
      <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">一時所得の計算</legend><div><label htmlFor="temporaryRevenue" className="block text-sm font-medium text-gray-700">総収入金額 (円)</label><input id="temporaryRevenue" name="temporaryRevenue" type="text" value={formatNumber(values.temporaryRevenue)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="temporaryExpenses" className="block text-sm font-medium text-gray-700">支出した金額 (円)</label><input id="temporaryExpenses" name="temporaryExpenses" type="text" value={formatNumber(values.temporaryExpenses)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="temporarySpecial" className="block text-sm font-medium text-gray-700">特別控除額 (円)</label><input id="temporarySpecial" name="temporarySpecialDeduction" type="text" value={formatNumber(incomes.temporarySpecialDeduction)} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div><div><label htmlFor="temporaryNetIncome" className="block text-sm font-medium text-gray-700">一時所得 (総所得金額への算入額) (円)</label><input id="temporaryNetIncome" name="temporaryNetIncome" type="text" value={formatNumber(incomes.temporaryBeforeHalf / 2)} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div></fieldset></div>
      <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">雑所得の計算</legend><div><label htmlFor="ageCategory" className="block text-sm font-medium text-gray-700">本人の年齢区分</label><select id="ageCategory" name="ageCategory" value={values.ageCategory} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="none">年金なし</option><option value="under65">65歳未満</option><option value="over65">65歳以上</option></select></div><div><label htmlFor="pensionRevenue" className="block text-sm font-medium text-gray-700">公的年金等の収入金額 (円)</label><input id="pensionRevenue" name="pensionRevenue" type="text" value={formatNumber(values.pensionRevenue)} onChange={handleChange} disabled={!pensionEnabled} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" /></div><div><label htmlFor="publicPensionIncome" className="block text-sm font-medium text-gray-700">公的年金等に係る雑所得 (円)</label><input id="publicPensionIncome" name="publicPensionIncome" type="text" value={formatNumber(incomes.publicPension)} readOnly disabled={!pensionEnabled} className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm disabled:bg-gray-50" /></div><div><label htmlFor="otherMiscRevenue" className="block text-sm font-medium text-gray-700">その他雑所得の収入 (円)</label><input id="otherMiscRevenue" name="otherMiscRevenue" type="text" value={formatNumber(values.otherMiscRevenue)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="otherMiscExpenses" className="block text-sm font-medium text-gray-700">必要経費 (円)</label><input id="otherMiscExpenses" name="otherMiscExpenses" type="text" value={formatNumber(values.otherMiscExpenses)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div><div><label htmlFor="miscNetIncome" className="block text-sm font-medium text-gray-700">雑所得 (円)</label><input id="miscNetIncome" name="miscNetIncome" type="text" value={formatNumber(incomes.miscellaneous)} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div></fieldset></div>
      <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">合計所得金額の計算</legend><div><label htmlFor="blueDeduction" className="block text-sm font-medium text-gray-700">青色申告特別控除額 (円)</label><select id="blueDeduction" name="blueDeduction" value={values.blueDeduction} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="0">控除なし</option><option value="650000">65万円</option><option value="550000">55万円</option><option value="100000">10万円</option></select></div><div><label htmlFor="totalIncome" className="block text-sm font-medium text-gray-700">合計所得金額 (円)</label><input id="totalIncome" name="totalIncome" type="text" value={formatNumber(incomes.totalIncome)} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div></fieldset></div>
      {/* ナビゲーションボタン */}
      <div className="flex justify-end">
        <button onClick={() => onNavigate('deductions')} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
          所得控除の計算へ進む →
        </button>
      </div>
    </div>
  );
};

// 2. 所得控除計算画面 (今回はプレースホルダー)
const DeductionsPage = ({ incomes, onNavigate }) => {
  return (
    <div className="md:col-span-2 space-y-6">
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">所得控除の計算</h2>
        <p className="mb-4">ここでは、所得控除額を計算します。</p>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold">前画面で計算された合計所得金額:</p>
          <p className="text-2xl font-bold text-blue-800">{formatNumber(incomes.totalIncome)} 円</p>
        </div>
        <div className="mt-6">
          <button onClick={() => onNavigate('income')} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75">
            ← 所得の入力に戻る
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 親コンポーネント (アプリケーション全体を管理) ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('income'); // 'income' or 'deductions'
  
  const [values, setValues] = useState({
    salaryRevenue: 0, realEstateRevenue: 0, realEstateExpenses: 0, realEstateInterest: 0,
    businessRevenue: 0, businessExpenses: 0, temporaryRevenue: 0, temporaryExpenses: 0, 
    ageCategory: 'none', pensionRevenue: 0, otherMiscRevenue: 0, otherMiscExpenses: 0, 
    blueDeduction: '0', socialInsuranceDeduction: 0, lifeInsuranceDeduction: 0, spouseDeduction: 'none',
  });

  const [incomes, setIncomes] = useState({
    salary: 0, salaryDeduction: 0, realEstate: 0, business: 0, 
    temporaryBeforeHalf: 0, temporarySpecialDeduction: 0,
    publicPension: 0, otherMisc: 0, miscellaneous: 0,
    grossIncome: 0, totalIncome: 0,
    applicableBlueDeduction: 0,
  });

  const [tax, setTax] = useState({ incomeTax: 0, residentTax: 0, taxableIncome: 0 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = value.replace(/,/g, '');
    setValues(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  // 計算ロジックは親コンポーネントで実行
  useEffect(() => {
    const salaryRevenue = Number(values.salaryRevenue) || 0;
    const salaryIncome = calculateSalaryIncome(salaryRevenue);
    const salaryDeduction = salaryRevenue > 0 ? Math.max(0, salaryRevenue - salaryIncome) : 0;
    const reRevenue = Number(values.realEstateRevenue) || 0;
    const reExpenses = Number(values.realEstateExpenses) || 0;
    const reInterest = Number(values.realEstateInterest) || 0;
    const reRawIncome = reRevenue - reExpenses;
    let realEstateIncome = (reRawIncome < 0) ? reRawIncome + reInterest : reRawIncome;
    const businessIncome = Math.max(0, Number(values.businessRevenue) - Number(values.businessExpenses));
    const tempRevenue = Number(values.temporaryRevenue) || 0;
    const tempExpenses = Number(values.temporaryExpenses) || 0;
    const tempIncomeRaw = tempRevenue - tempExpenses;
    const temporarySpecialDeduction = Math.min(Math.max(0, tempIncomeRaw), 500000);
    const temporaryBeforeHalf = Math.max(0, tempIncomeRaw - temporarySpecialDeduction);
    const otherMiscIncome = Math.max(0, Number(values.otherMiscRevenue) - Number(values.otherMiscExpenses));
    const otherIncomeForPensionCalc = salaryIncome + realEstateIncome + businessIncome + temporaryBeforeHalf + otherMiscIncome;
    const age = values.ageCategory === 'under65' ? 64 : (values.ageCategory === 'over65' ? 65 : 0);
    const pensionRevenue = Number(values.pensionRevenue) || 0;
    const publicPensionIncome = age > 0 ? calculatePublicPensionIncome(pensionRevenue, age, otherIncomeForPensionCalc) : 0;
    const miscellaneousIncome = publicPensionIncome + otherMiscIncome;
    const grossIncome = salaryIncome + realEstateIncome + businessIncome + (temporaryBeforeHalf / 2) + miscellaneousIncome;
    const blueDeductionSource = realEstateIncome + businessIncome;
    const applicableBlueDeduction = Math.min(Number(values.blueDeduction), Math.max(0, blueDeductionSource));
    const totalIncome = Math.max(0, grossIncome - applicableBlueDeduction);

    setIncomes({
      salary: salaryIncome, salaryDeduction: salaryDeduction,
      realEstate: realEstateIncome, business: businessIncome,
      temporaryBeforeHalf: temporaryBeforeHalf, temporarySpecialDeduction: temporarySpecialDeduction,
      publicPension: publicPensionIncome, otherMisc: otherMiscIncome, miscellaneous: miscellaneousIncome,
      grossIncome: grossIncome, 
      totalIncome: totalIncome,
      applicableBlueDeduction: applicableBlueDeduction,
    });
  }, [values]);

  useEffect(() => {
    const taxResult = calculateTax({ totalIncome: incomes.totalIncome, socialInsuranceDeduction: values.socialInsuranceDeduction, lifeInsuranceDeduction: values.lifeInsuranceDeduction, spouseDeduction: values.spouseDeduction });
    setTax(taxResult);
  }, [incomes.totalIncome, values.socialInsuranceDeduction, values.lifeInsuranceDeduction, values.spouseDeduction]);

  // 計算結果表示コンポーネント
  const CalculationResult = () => (
    <div className="md:col-span-1 space-y-6">
        <div className="p-4 bg-white rounded-lg shadow sticky top-4">
            <h2 className="text-xl font-bold text-center mb-4">計算結果</h2>
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold text-lg border-b pb-1">所得金額</h3>
              <p className="flex justify-between">給与所得: <span>{formatNumber(incomes.salary)}円</span></p>
              <p className="flex justify-between">不動産所得: <span>{formatNumber(incomes.realEstate)}円</span></p>
              <p className="flex justify-between">事業所得: <span>{formatNumber(incomes.business)}円</span></p>
              <p className="flex justify-between">一時所得 (1/2後): <span>{formatNumber(incomes.temporaryBeforeHalf / 2)}円</span></p>
              <p className="flex justify-between">雑所得: <span>{formatNumber(incomes.miscellaneous)}円</span></p>
              <hr className="my-1"/>
              <p className="flex justify-between text-blue-600">▲青色申告特別控除: <span>{formatNumber(incomes.applicableBlueDeduction)}円</span></p>
              <p className="flex justify-between font-bold text-xl mt-2">合計所得金額: <span>{formatNumber(incomes.totalIncome)}円</span></p>
            </div>
            {/* [修正] 所得控除計算画面にいるときだけ税額計算結果を表示 */}
            {currentPage === 'deductions' && (
              <>
                <div className="space-y-2 text-sm mt-4"><h3 className="font-semibold text-lg border-b pb-1">課税所得</h3><p className="flex justify-between">合計所得金額: <span>{formatNumber(incomes.totalIncome)}円</span></p><p className="flex justify-between">▲ 所得控除合計: <span>{formatNumber(getBasicDeduction(incomes.totalIncome) + getSpouseDeduction(values.spouseDeduction, values.totalIncome) + Number(values.socialInsuranceDeduction) + Number(values.lifeInsuranceDeduction))}円</span></p><hr className="my-1"/><p className="flex justify-between font-bold text-xl mt-2">課税所得金額: <span>{formatNumber(tax.taxableIncome)}円</span></p></div>
                <div className="space-y-2 mt-4"><h3 className="font-semibold text-lg border-b pb-1">概算税額</h3><p className="flex justify-between text-red-600 font-bold text-xl">所得税: <span>{formatNumber(tax.incomeTax)}円</span></p><p className="flex justify-between text-green-600 font-bold text-xl">住民税: <span>{formatNumber(tax.residentTax)}円</span></p></div>
              </>
            )}
        </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">所得税・住民税簡易シミュレーション</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {currentPage === 'income' ? (
          <IncomePage values={values} incomes={incomes} handleChange={handleChange} onNavigate={setCurrentPage} />
        ) : (
          <DeductionsPage incomes={incomes} onNavigate={setCurrentPage} />
        )}
        <CalculationResult />
      </div>
    </div>
  );
};

export default App;
