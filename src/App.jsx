import React, { useState, useEffect } from 'react';

// --- 計算ロジック関数群 ---

/**
 * 給与収入から給与所得を計算する
 * @param {number} revenue 給与収入
 * @returns {number} 給与所得
 */
const calculateSalaryIncome = (revenue) => {
  if (revenue <= 0) return 0;
  if (revenue <= 1625000) return Math.max(0, revenue - 550000);
  if (revenue <= 1800000) return Math.round(revenue / 4) * 2.4 - 100000;
  if (revenue <= 3600000) return Math.round(revenue / 4) * 2.8 - 180000;
  if (revenue <= 6600000) return Math.round(revenue / 4) * 3.2 - 440000;
  if (revenue <= 8500000) return revenue * 0.9 - 1100000;
  return revenue - 1950000;
};

/**
 * 公的年金等の収入から雑所得を計算する
 * @param {number} pensionRevenue 年金収入
 * @param {number} age 年齢
 * @param {number} otherIncomeForPensionCalc 年金以外の所得合計
 * @returns {number} 公的年金等に係る雑所得
 */
const calculatePublicPensionIncome = (pensionRevenue, age, otherIncomeForPensionCalc) => {
    if (pensionRevenue <= 0) return 0;
    const isOver65 = age >= 65;
    let deduction = 0;
    if (otherIncomeForPensionCalc <= 10000000) {
        if (isOver65) {
            if (pensionRevenue < 3300000) deduction = 1100000;
            else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 275000;
            else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 685000;
            else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1455000;
            else deduction = 1955000;
        } else {
            if (pensionRevenue < 1300000) deduction = 600000;
            else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 275000;
            else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 685000;
            else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1455000;
            else deduction = 1955000;
        }
    } else if (otherIncomeForPensionCalc <= 20000000) {
        if (isOver65) { deduction = 1855000; } else { deduction = 1855000; }
    } else {
        if (isOver65) { deduction = 1755000; } else { deduction = 1755000; }
    }
    return Math.max(0, pensionRevenue - deduction);
};

// --- 各種控除計算 ---
const getBasicDeduction = (totalIncome) => {
    if (totalIncome <= 24000000) return 480000;
    if (totalIncome <= 24500000) return 320000;
    if (totalIncome <= 25000000) return 160000;
    return 0;
};
const getBasicDeductionForResidentTax = (totalIncome) => {
    if (totalIncome <= 24000000) return 430000;
    if (totalIncome <= 24500000) return 290000;
    if (totalIncome <= 25000000) return 150000;
    return 0;
};
const calculateMiscLossDeduction = (values, totalIncomeForMiscLoss) => {
    const damage = Number(values.miscLossDamage) || 0;
    const disasterSpending = Number(values.miscLossDisaster) || 0;
    const insurance = Number(values.miscLossInsurance) || 0;
    const netLoss = damage + disasterSpending - insurance;
    if (netLoss <= 0) return { netLoss: 0, deduction: 0 };
    const optionA = netLoss - (totalIncomeForMiscLoss * 0.1);
    const optionB = disasterSpending - 50000;
    const deduction = Math.max(0, optionA, optionB);
    return { netLoss, deduction };
};
const calculateMedicalExpenseDeduction = (values) => {
    const medicalPaid = Number(values.medicalPaid) || 0;
    const medicalInsurance = Number(values.medicalInsurance) || 0;
    const deduction = (medicalPaid - medicalInsurance) - 100000;
    return Math.min(Math.max(0, deduction), 2000000);
};
const calculateLifeInsuranceDeduction = (values) => {
    const calcDeductionForCategory = (payment, isNewSystem) => {
        const p = Number(payment) || 0;
        let incomeTaxDed = 0, residentTaxDed = 0;
        if (isNewSystem) {
            if (p <= 20000) incomeTaxDed = p; else if (p <= 40000) incomeTaxDed = p * 0.5 + 10000; else if (p <= 80000) incomeTaxDed = p * 0.25 + 20000; else incomeTaxDed = 40000;
            if (p <= 12000) residentTaxDed = p; else if (p <= 32000) residentTaxDed = p * 0.5 + 6000; else if (p <= 56000) residentTaxDed = p * 0.25 + 14000; else residentTaxDed = 28000;
        } else {
            if (p <= 25000) incomeTaxDed = p; else if (p <= 50000) incomeTaxDed = p * 0.5 + 12500; else if (p <= 100000) incomeTaxDed = p * 0.25 + 25000; else incomeTaxDed = 50000;
            if (p <= 15000) residentTaxDed = p; else if (p <= 40000) residentTaxDed = p * 0.5 + 7500; else if (p <= 70000) residentTaxDed = p * 0.25 + 17500; else residentTaxDed = 35000;
        }
        return { incomeTaxDed, residentTaxDed };
    };
    const newLife = calcDeductionForCategory(values.lifeInsuranceNew, true);
    const nursing = calcDeductionForCategory(values.nursingInsurance, true);
    const newPension = calcDeductionForCategory(values.pensionInsuranceNew, true);
    const oldLife = calcDeductionForCategory(values.lifeInsuranceOld, false);
    const oldPension = calcDeductionForCategory(values.pensionInsuranceOld, false);
    const ded_IT_life = Math.min(40000, newLife.incomeTaxDed + oldLife.incomeTaxDed);
    const ded_IT_nursing = Math.min(40000, nursing.incomeTaxDed);
    const ded_IT_pension = Math.min(40000, newPension.incomeTaxDed + oldPension.incomeTaxDed);
    const ded_RT_life = Math.min(28000, newLife.residentTaxDed + oldLife.residentTaxDed);
    const ded_RT_nursing = Math.min(28000, nursing.residentTaxDed);
    const ded_RT_pension = Math.min(28000, newPension.residentTaxDed + oldPension.residentTaxDed);
    const totalIncomeTaxDeduction = Math.min(120000, ded_IT_life + ded_IT_nursing + ded_IT_pension);
    const totalResidentTaxDeduction = Math.min(70000, ded_RT_life + ded_RT_nursing + ded_RT_pension);
    return { incomeTaxDeduction: Math.round(totalIncomeTaxDeduction), residentTaxDeduction: Math.round(totalResidentTaxDeduction) };
};
const calculateEarthquakeInsuranceDeduction = (values) => {
    const earthquakePayment = Number(values.earthquakeInsurance) || 0;
    const oldLongTermPayment = Number(values.longTermNonLifeInsurance) || 0;
    let ded_IT_earthquake = 0;
    if (earthquakePayment <= 50000) ded_IT_earthquake = earthquakePayment; else ded_IT_earthquake = 50000;
    let ded_IT_oldLongTerm = 0;
    if (oldLongTermPayment <= 10000) ded_IT_oldLongTerm = oldLongTermPayment; else if (oldLongTermPayment <= 20000) ded_IT_oldLongTerm = oldLongTermPayment * 0.5 + 5000; else ded_IT_oldLongTerm = 15000;
    const totalIncomeTaxDeduction = Math.min(50000, ded_IT_earthquake + ded_IT_oldLongTerm);
    const ded_RT_earthquake = Math.min(25000, earthquakePayment * 0.5);
    let ded_RT_oldLongTerm = 0;
    if (oldLongTermPayment <= 5000) ded_RT_oldLongTerm = oldLongTermPayment; else if (oldLongTermPayment <= 15000) ded_RT_oldLongTerm = oldLongTermPayment * 0.5 + 2500; else ded_RT_oldLongTerm = 10000;
    const totalResidentTaxDeduction = Math.min(25000, ded_RT_earthquake + ded_RT_oldLongTerm);
    return { incomeTaxDeduction: Math.round(totalIncomeTaxDeduction), residentTaxDeduction: Math.round(totalResidentTaxDeduction) };
};
// TODO: Implement calculation logic for spouse, dependents etc.
const calculateSpouseAndDependentsDeduction = (values) => {
    // This is a placeholder. Real logic is complex.
    return { spouseDeduction: 0, specialSpouseDeduction: 0, dependentsDeduction: 0 };
};

// --- 税額計算 ---
const getIncomeTax = (taxableIncome) => {
    let tax = 0;
    if (taxableIncome <= 1950000) tax = taxableIncome * 0.05;
    else if (taxableIncome <= 3300000) tax = taxableIncome * 0.10 - 97500;
    else if (taxableIncome <= 6950000) tax = taxableIncome * 0.20 - 427500;
    else if (taxableIncome <= 9000000) tax = taxableIncome * 0.23 - 636000;
    else if (taxableIncome <= 18000000) tax = taxableIncome * 0.33 - 1536000;
    else if (taxableIncome <= 40000000) tax = taxableIncome * 0.40 - 2796000;
    else tax = taxableIncome * 0.45 - 4796000;
    const specialTax = tax * 0.021;
    return Math.floor(tax + specialTax);
};
const getResidentTax = (taxableIncome) => {
    if (taxableIncome <= 0) return 0;
    const incomeProportional = taxableIncome * 0.1;
    const perCapita = 5000;
    return Math.floor(incomeProportional + perCapita);
};
const calculateTax = (values, totalIncome, deductions) => {
    const otherDeductions =
        (Number(values.donationAmount) || 0) > 2000 ? (Number(values.donationAmount) - 2000) : 0; // Simplified donation deduction

    const commonDeductions =
        (Number(values.socialInsuranceDeduction) || 0) +
        (Number(values.smallBizKyosai) || 0) +
        deductions.miscLossDeduction +
        deductions.medicalExpenseDeduction +
        otherDeductions +
        deductions.spouseDeduction +
        deductions.specialSpouseDeduction +
        deductions.dependentsDeduction;

    const basicDeductionForIT = getBasicDeduction(totalIncome);
    const totalDeductionsForIT = basicDeductionForIT + commonDeductions + deductions.lifeInsuranceDeduction + deductions.earthquakeInsuranceDeduction;
    const taxableIncomeForIT = Math.floor(Math.max(0, totalIncome - totalDeductionsForIT) / 1000) * 1000;
    const incomeTax = getIncomeTax(taxableIncomeForIT);

    const basicDeductionForRT = getBasicDeductionForResidentTax(totalIncome);
    const totalDeductionsForRT = basicDeductionForRT + commonDeductions + deductions.lifeInsuranceDeductionForResidentTax + deductions.earthquakeInsuranceDeductionForResidentTax;
    const taxableIncomeForRT = Math.max(0, totalIncome - totalDeductionsForRT);
    const residentTax = getResidentTax(taxableIncomeForRT);

    return { incomeTax, residentTax, taxableIncome: taxableIncomeForIT, totalDeductions: totalDeductionsForIT };
};

// --- UIコンポーネント ---
const formatNumber = (num) => Number(num || 0).toLocaleString();
const parseNumber = (str) => String(str).replace(/,/g, '');

const InputField = ({ label, name, value, onChange, disabled = false, subtext }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <input id={name} name={name} type="text" value={formatNumber(value)} onChange={onChange} disabled={disabled} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"/>
    {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
  </div>
);
const ReadOnlyField = ({ label, value, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input type="text" value={formatNumber(value)} readOnly disabled={disabled} className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm disabled:bg-gray-50"/>
  </div>
);
const SelectField = ({ label, name, value, onChange, options, subtext }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <select id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
    </div>
);

// --- ページコンポーネント ---
const IncomePage = ({ values, incomes, handleChange, onNavigate }) => (
    <div className="md:col-span-2 space-y-6">
        <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">給与所得の計算</legend><InputField label="給与収入 (円)" name="salaryRevenue" value={values.salaryRevenue} onChange={handleChange} /><ReadOnlyField label="給与所得控除 (円)" value={incomes.salaryDeduction} /><ReadOnlyField label="給与所得 (円)" value={incomes.salary} /></fieldset></div>
        <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">不動産所得の計算</legend><InputField label="収入金額 (円)" name="realEstateRevenue" value={values.realEstateRevenue} onChange={handleChange} /><InputField label="必要経費 (円)" name="realEstateExpenses" value={values.realEstateExpenses} onChange={handleChange} /><ReadOnlyField label="不動産所得 (円)" value={incomes.realEstate} /></fieldset></div>
        <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">事業所得の計算</legend><InputField label="収入金額 (円)" name="businessRevenue" value={values.businessRevenue} onChange={handleChange} /><InputField label="必要経費 (円)" name="businessExpenses" value={values.businessExpenses} onChange={handleChange} /><ReadOnlyField label="事業所得 (円)" value={incomes.business} /></fieldset></div>
        <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">一時所得の計算</legend><InputField label="総収入金額 (円)" name="temporaryRevenue" value={values.temporaryRevenue} onChange={handleChange} /><InputField label="支出した金額 (円)" name="temporaryExpenses" value={values.temporaryExpenses} onChange={handleChange} /><ReadOnlyField label="特別控除額 (円)" value={incomes.temporarySpecialDeduction} /><ReadOnlyField label="一時所得 (総所得金額への算入額) (円)" value={incomes.temporary} /></fieldset></div>
        <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">雑所得の計算</legend><SelectField label="公的年金の年齢区分" name="ageCategory" value={values.ageCategory} onChange={handleChange} options={[{value: 'none', label: '年金なし'}, {value: 'under65', label: '65歳未満'}, {value: 'over65', label: '65歳以上'}]} /><InputField label="公的年金等の収入金額 (円)" name="pensionRevenue" value={values.pensionRevenue} onChange={handleChange} disabled={values.ageCategory === 'none'} /><ReadOnlyField label="公的年金等に係る雑所得 (円)" value={incomes.publicPension} disabled={values.ageCategory === 'none'} /><InputField label="その他の雑所得の収入 (円)" name="otherMiscRevenue" value={values.otherMiscRevenue} onChange={handleChange} /><InputField label="必要経費 (円)" name="otherMiscExpenses" value={values.otherMiscExpenses} onChange={handleChange} /><ReadOnlyField label="雑所得 (円)" value={incomes.miscellaneous} /></fieldset></div>
        <div className="p-4 bg-white rounded-lg shadow"><fieldset className="space-y-4"><legend className="text-lg font-semibold border-b pb-2 mb-4 w-full">合計所得金額の計算</legend><SelectField label="青色申告特別控除額 (円)" name="blueDeduction" value={values.blueDeduction} onChange={handleChange} options={[{value: '0', label: '控除なし'}, {value: '650000', label: '65万円'}, {value: '550000', label: '55万円'}, {value: '100000', label: '10万円'}]} /><ReadOnlyField label="合計所得金額 (円)" value={incomes.totalIncome} /></fieldset></div>
        <div className="flex justify-end"><button onClick={() => onNavigate('deductions1')} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">所得控除の入力へ進む →</button></div>
    </div>
);

const DeductionsPage1 = ({ values, handleChange, onNavigate, deductions }) => (
    <div className="md:col-span-2 space-y-6">
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-6 border-b pb-3">所得控除の入力 (1/2)</h2>
            <div className="space-y-6">
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">雑損控除</legend><InputField label="損害金額 (円)" name="miscLossDamage" value={values.miscLossDamage} onChange={handleChange} /><InputField label="災害関連支出 (円)" name="miscLossDisaster" value={values.miscLossDisaster} onChange={handleChange} /><InputField label="保険金等 (円)" name="miscLossInsurance" value={values.miscLossInsurance} onChange={handleChange} /><ReadOnlyField label="差引損失額 (円)" value={deductions.miscLossNet} /><ReadOnlyField label="雑損控除の額 (円)" value={deductions.miscLossDeduction} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">医療費控除</legend><InputField label="支払った医療費の合計額 (円)" name="medicalPaid" value={values.medicalPaid} onChange={handleChange} /><InputField label="保険金等 (円)" name="medicalInsurance" value={values.medicalInsurance} onChange={handleChange} /><ReadOnlyField label="医療費控除の額 (円)" value={deductions.medicalExpenseDeduction} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">社会保険料控除</legend><InputField label="支払った掛金の合計額 (円)" name="socialInsuranceDeduction" value={values.socialInsuranceDeduction} onChange={handleChange} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">小規模企業共済等掛金控除</legend><InputField label="支払った掛金の合計額 (円)" name="smallBizKyosai" value={values.smallBizKyosai} onChange={handleChange} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">生命保険料控除</legend><InputField label="新生命保険料の支払額 (円)" name="lifeInsuranceNew" value={values.lifeInsuranceNew} onChange={handleChange} /><InputField label="介護医療保険料の支払額 (円)" name="nursingInsurance" value={values.nursingInsurance} onChange={handleChange} /><InputField label="新個人年金保険料の支払額 (円)" name="pensionInsuranceNew" value={values.pensionInsuranceNew} onChange={handleChange} /><InputField label="旧生命保険料の支払額 (円)" name="lifeInsuranceOld" value={values.lifeInsuranceOld} onChange={handleChange} /><InputField label="旧個人年金保険料の支払額 (円)" name="pensionInsuranceOld" value={values.pensionInsuranceOld} onChange={handleChange} /><ReadOnlyField label="生命保険料控除の額 (円)" value={deductions.lifeInsuranceDeduction} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">地震保険料控除</legend><InputField label="地震保険料の支払額 (円)" name="earthquakeInsurance" value={values.earthquakeInsurance} onChange={handleChange} /><InputField label="旧長期損害保険料の支払額 (円)" name="longTermNonLifeInsurance" value={values.longTermNonLifeInsurance} onChange={handleChange} /><ReadOnlyField label="地震保険料控除の額 (円)" value={deductions.earthquakeInsuranceDeduction} /></fieldset>
            </div>
            <div className="mt-8 flex justify-between">
                <button onClick={() => onNavigate('income')} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75">← 所得の入力に戻る</button>
                <button onClick={() => onNavigate('deductions2')} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">所得控除の入力を続ける →</button>
            </div>
        </div>
    </div>
);

const DeductionsPage2 = ({ values, handleChange, onNavigate, deductions }) => (
    <div className="md:col-span-2 space-y-6">
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-6 border-b pb-3">所得控除の入力 (2/2)</h2>
            <div className="space-y-6">
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">寄付金控除</legend><InputField label="特定寄付金の支払額" name="donationAmount" value={values.donationAmount} onChange={handleChange} /><ReadOnlyField label="寄付金控除の額" value={deductions.donationDeduction} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">寡婦・ひとり親控除</legend><SelectField label="該当の判定" name="widowStatus" value={values.widowStatus} onChange={handleChange} options={[{value: 'none', label: '該当なし'}, {value: 'widow', label: '寡婦'}, {value: 'single_parent', label: 'ひとり親'}]} /><ReadOnlyField label="寡婦・ひとり親控除の額" value={deductions.widowDeduction} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">勤労学生控除</legend><SelectField label="該当の判定" name="workingStudentStatus" value={values.workingStudentStatus} onChange={handleChange} options={[{value: 'none', label: '該当なし'}, {value: 'yes', label: '該当あり'}]} /><ReadOnlyField label="勤労学生控除の額" value={deductions.workingStudentDeduction} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">障害者控除</legend><SelectField label="一般障害者の人数" name="generalDisabilityCount" value={values.generalDisabilityCount} onChange={handleChange} options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}]} /><SelectField label="特別障害者の人数" name="specialDisabilityCount" value={values.specialDisabilityCount} onChange={handleChange} options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}]} /><SelectField label="同居特別障害者の人数" name="severeDisabilityCount" value={values.severeDisabilityCount} onChange={handleChange} options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}]} /><ReadOnlyField label="障害者控除の額" value={deductions.disabilityDeduction} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">配偶者控除・配偶者特別控除</legend><SelectField label="配偶者の有無" name="spouseStatus" value={values.spouseStatus} onChange={handleChange} options={[{value: 'none', label: 'なし'}, {value: 'yes', label: 'あり'}]} /><InputField label="配偶者の合計所得金額" name="spouseIncome" value={values.spouseIncome} onChange={handleChange} disabled={values.spouseStatus === 'none'} /><ReadOnlyField label="配偶者控除の額" value={deductions.spouseDeduction} /><ReadOnlyField label="配偶者特別控除の額" value={deductions.specialSpouseDeduction} /></fieldset>
                <fieldset className="p-4 border rounded-lg space-y-4"><legend className="font-semibold px-2">扶養控除</legend><SelectField label="一般扶養親族の人数" name="dependents16to18" value={values.dependents16to18} onChange={handleChange} subtext="16歳以上19歳未満" options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}, {value: 3, label: '3人'}]} /><SelectField label="特定扶養親族の人数" name="dependents19to22" value={values.dependents19to22} onChange={handleChange} subtext="19歳以上23歳未満" options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}, {value: 3, label: '3人'}]} /><SelectField label="老人扶養親族の人数" name="dependents70plus" value={values.dependents70plus} onChange={handleChange} subtext="70歳以上（同居老親等以外）" options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}, {value: 3, label: '3人'}]} /><SelectField label="同居老親等の人数" name="dependents70plusLivingTogether" value={values.dependents70plusLivingTogether} onChange={handleChange} subtext="70歳以上（同居老親等）" options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}, {value: 3, label: '3人'}]} /><ReadOnlyField label="扶養控除の額" value={deductions.dependentsDeduction} /></fieldset>
            </div>
            <div className="mt-8 flex justify-between"><button onClick={() => onNavigate('deductions1')} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75">← 前のページに戻る</button></div>
        </div>
    </div>
);


// --- メインコンポーネント ---
function App() {
  const [currentPage, setCurrentPage] = useState('income');

  const [values, setValues] = useState({
    salaryRevenue: 5000000, realEstateRevenue: 0, realEstateExpenses: 0,
    businessRevenue: 0, businessExpenses: 0, temporaryRevenue: 0, temporaryExpenses: 0,
    ageCategory: 'none', pensionRevenue: 0, otherMiscRevenue: 0, otherMiscExpenses: 0,
    blueDeduction: '0',
    socialInsuranceDeduction: 0, smallBizKyosai: 0,
    lifeInsuranceNew: 0, nursingInsurance: 0, pensionInsuranceNew: 0, lifeInsuranceOld: 0, pensionInsuranceOld: 0,
    earthquakeInsurance: 0, longTermNonLifeInsurance: 0,
    miscLossDamage: 0, miscLossDisaster: 0, miscLossInsurance: 0,
    medicalPaid: 0, medicalInsurance: 0,
    donationAmount: 0,
    widowStatus: 'none',
    workingStudentStatus: 'none',
    generalDisabilityCount: 0, specialDisabilityCount: 0, severeDisabilityCount: 0,
    spouseStatus: 'none', spouseIncome: 0,
    dependents16to18: 0, dependents19to22: 0, dependents70plus: 0, dependents70plusLivingTogether: 0,
  });

  const [incomes, setIncomes] = useState({
    salary: 0, salaryDeduction: 0, realEstate: 0, business: 0,
    temporary: 0, temporarySpecialDeduction: 0,
    publicPension: 0, otherMisc: 0, miscellaneous: 0,
    grossIncome: 0, totalIncome: 0,
    applicableBlueDeduction: 0,
  });

  const [deductions, setDeductions] = useState({
      miscLossNet: 0, miscLossDeduction: 0, medicalExpenseDeduction: 0,
      lifeInsuranceDeduction: 0, lifeInsuranceDeductionForResidentTax: 0,
      earthquakeInsuranceDeduction: 0, earthquakeInsuranceDeductionForResidentTax: 0,
      donationDeduction: 0, widowDeduction: 0, workingStudentDeduction: 0,
      disabilityDeduction: 0, spouseDeduction: 0, specialSpouseDeduction: 0,
      dependentsDeduction: 0,
  });

  const [tax, setTax] = useState({ incomeTax: 0, residentTax: 0, taxableIncome: 0, totalDeductions: 0 });

  const handleNavigate = (page) => {
      setCurrentPage(page);
      window.scrollTo(0, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = e.target.tagName === 'SELECT' ? value : parseNumber(value);
    setValues(prev => ({ ...prev, [name]: parsedValue }));
  };

  useEffect(() => {
    const salaryRevenue = Number(values.salaryRevenue) || 0;
    const salaryIncome = calculateSalaryIncome(salaryRevenue);
    const salaryDeduction = salaryRevenue > 0 ? Math.max(0, salaryRevenue - salaryIncome) : 0;
    const reIncome = Math.max(0, (Number(values.realEstateRevenue) || 0) - (Number(values.realEstateExpenses) || 0));
    const businessIncome = Math.max(0, (Number(values.businessRevenue) || 0) - (Number(values.businessExpenses) || 0));
    const tempRevenue = Number(values.temporaryRevenue) || 0;
    const tempExpenses = Number(values.temporaryExpenses) || 0;
    const tempIncomeRaw = tempRevenue - tempExpenses;
    const temporarySpecialDeduction = Math.min(Math.max(0, tempIncomeRaw), 500000);
    const temporaryBeforeHalf = Math.max(0, tempIncomeRaw - temporarySpecialDeduction);
    const temporaryIncome = temporaryBeforeHalf / 2;
    const otherMiscIncome = Math.max(0, (Number(values.otherMiscRevenue) || 0) - (Number(values.otherMiscExpenses) || 0));
    const otherIncomeForPensionCalc = salaryIncome + reIncome + businessIncome + temporaryIncome + otherMiscIncome;
    const age = values.ageCategory === 'under65' ? 64 : (values.ageCategory === 'over65' ? 65 : 0);
    const pensionRevenue = Number(values.pensionRevenue) || 0;
    const publicPensionIncome = age > 0 ? calculatePublicPensionIncome(pensionRevenue, age, otherIncomeForPensionCalc) : 0;
    const miscellaneousIncome = publicPensionIncome + otherMiscIncome;
    const grossIncome = salaryIncome + reIncome + businessIncome + temporaryIncome + miscellaneousIncome;
    const blueDeductionSource = reIncome + businessIncome;
    const applicableBlueDeduction = Math.min(Number(values.blueDeduction), Math.max(0, blueDeductionSource));
    const totalIncome = Math.max(0, grossIncome - applicableBlueDeduction);
    setIncomes({
      salary: salaryIncome, salaryDeduction, realEstate: reIncome, business: businessIncome,
      temporary: temporaryIncome, temporarySpecialDeduction,
      publicPension: publicPensionIncome, otherMisc: otherMiscIncome, miscellaneous: miscellaneousIncome,
      grossIncome, totalIncome, applicableBlueDeduction,
    });
    const miscLossResult = calculateMiscLossDeduction(values, totalIncome);
    const medicalDeductionResult = calculateMedicalExpenseDeduction(values);
    const lifeInsuranceResult = calculateLifeInsuranceDeduction(values);
    const earthquakeInsuranceResult = calculateEarthquakeInsuranceDeduction(values);
    const spouseAndDependentsResult = calculateSpouseAndDependentsDeduction(values);
    setDeductions({
        miscLossNet: miscLossResult.netLoss,
        miscLossDeduction: miscLossResult.deduction,
        medicalExpenseDeduction: medicalDeductionResult,
        lifeInsuranceDeduction: lifeInsuranceResult.incomeTaxDeduction,
        lifeInsuranceDeductionForResidentTax: lifeInsuranceResult.residentTaxDeduction,
        earthquakeInsuranceDeduction: earthquakeInsuranceResult.incomeTaxDeduction,
        earthquakeInsuranceDeductionForResidentTax: earthquakeInsuranceResult.residentTaxDeduction,
        donationDeduction: 0,
        widowDeduction: 0,
        workingStudentDeduction: 0,
        disabilityDeduction: 0,
        spouseDeduction: spouseAndDependentsResult.spouseDeduction,
        specialSpouseDeduction: spouseAndDependentsResult.specialSpouseDeduction,
        dependentsDeduction: spouseAndDependentsResult.dependentsDeduction,
    });
  }, [values]);

  useEffect(() => {
    const taxResult = calculateTax(values, incomes.totalIncome, deductions);
    setTax(taxResult);
  }, [values, incomes, deductions]);

  const CalculationResult = () => (
    <div className="md:col-span-1 space-y-6">
        <div className="p-4 bg-white rounded-lg shadow sticky top-4">
            <h2 className="text-xl font-bold text-center mb-4">計算結果</h2>
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold text-lg border-b pb-1">所得金額</h3>
              <p className="flex justify-between">給与所得: <span>{formatNumber(incomes.salary)}円</span></p>
              <p className="flex justify-between">不動産所得: <span>{formatNumber(incomes.realEstate)}円</span></p>
              <p className="flex justify-between">事業所得: <span>{formatNumber(incomes.business)}円</span></p>
              <p className="flex justify-between">一時所得: <span>{formatNumber(incomes.temporary)}円</span></p>
              <p className="flex justify-between">雑所得: <span>{formatNumber(incomes.miscellaneous)}円</span></p>
              <hr className="my-1"/>
              <p className="flex justify-between text-blue-600">▲ 青色申告特別控除: <span>{formatNumber(incomes.applicableBlueDeduction)}円</span></p>
              <p className="flex justify-between font-bold text-base mt-2">合計所得金額: <span>{formatNumber(incomes.totalIncome)}円</span></p>
            </div>
            <div className="space-y-2 text-sm mt-4">
              <h3 className="font-semibold text-lg border-b pb-1">課税所得</h3>
              <p className="flex justify-between">合計所得金額: <span>{formatNumber(incomes.totalIncome)}円</span></p>
              <p className="flex justify-between">▲ 所得控除合計: <span>{formatNumber(tax.totalDeductions)}円</span></p>
              <hr className="my-1"/>
              <p className="flex justify-between font-bold text-base mt-2">課税所得金額: <span>{formatNumber(tax.taxableIncome)}円</span></p>
            </div>
            <div className="space-y-2 mt-4">
              <h3 className="font-semibold text-lg border-b pb-1">税額</h3>
              <p className="flex justify-between text-red-600 font-bold text-xl">所得税: <span>{formatNumber(tax.incomeTax)}円</span></p>
              <p className="flex justify-between text-green-600 font-bold text-xl">住民税: <span>{formatNumber(tax.residentTax)}円</span></p>
            </div>
        </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
        case 'income':
            return <IncomePage values={values} incomes={incomes} handleChange={handleChange} onNavigate={handleNavigate} />;
        case 'deductions1':
            return <DeductionsPage1 values={values} handleChange={handleChange} onNavigate={handleNavigate} deductions={deductions} />;
        case 'deductions2':
            return <DeductionsPage2 values={values} handleChange={handleChange} onNavigate={handleNavigate} deductions={deductions} />;
        default:
            return <IncomePage values={values} incomes={incomes} handleChange={handleChange} onNavigate={handleNavigate} />;
    }
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 font-sans">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">所得税・住民税シミュレーション</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {renderPage()}
        <CalculationResult />
      </div>
    </div>
  );
}

export default App;

