import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react'; // ← この行を追加

// --- 計算ロジック関数群 (変更なし) ---
// Calculation logic functions (Unchanged)

/**
 * 給与収入から給与所得を計算する
 * @param {number} revenue 給与収入
 * @returns {number} 給与所得
 */
const calculateSalaryIncome = (revenue) => {
  if (revenue <= 0) return 0;
  if (revenue <= 1625000) return Math.max(0, revenue - 550000);
  // NOTE: This logic is based on the current version as per instructions.
  if (revenue <= 1800000) return Math.floor(revenue / 40000 * 2.4 * 10000) - 100000;
  if (revenue <= 3600000) return Math.floor(revenue / 40000 * 2.8 * 10000) - 180000;
  if (revenue <= 6600000) return Math.floor(revenue / 40000 * 3.2 * 10000) - 440000;
  if (revenue <= 8500000) return revenue * 0.9 - 1100000;
  return revenue - 1950000;
};


/**
 * 公的年金等の収入から雑所得を計算する (修正済み)
 * @param {number} pensionRevenue 年金収入
 * @param {number} age 年齢
 * @param {number} otherIncomeForPensionCalc 公的年金等に係る雑所得以外の合計所得金額
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
        } else { // 65歳未満
            if (pensionRevenue < 1300000) deduction = 600000;
            else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 275000;
            else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 685000;
            else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1455000;
            else deduction = 1955000;
        }
    } else if (otherIncomeForPensionCalc <= 20000000) {
        if (isOver65) {
            if (pensionRevenue < 3300000) deduction = 1000000;
            else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 175000;
            else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 585000;
            else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1355000;
            else deduction = 1855000;
        } else { // 65歳未満
            if (pensionRevenue < 1300000) deduction = 500000;
            else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 175000;
            else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 585000;
            else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1355000;
            else deduction = 1855000;
        }
    } else { // 2,000万円超
        if (isOver65) {
            if (pensionRevenue < 3300000) deduction = 900000;
            else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 75000;
            else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 485000;
            else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1255000;
            else deduction = 1755000;
        } else { // 65歳未満
            if (pensionRevenue < 1300000) deduction = 400000;
            else if (pensionRevenue < 4100000) deduction = pensionRevenue * 0.25 + 75000;
            else if (pensionRevenue < 7700000) deduction = pensionRevenue * 0.15 + 485000;
            else if (pensionRevenue < 10000000) deduction = pensionRevenue * 0.05 + 1255000;
            else deduction = 1755000;
        }
    }
    return Math.max(0, pensionRevenue - deduction);
};


// --- 各種控除計算 (変更なし) ---
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
const calculateDonationDeduction = (donationAmount, grossIncome) => {
    const amount = Number(donationAmount) || 0;
    if (amount <= 2000) return 0;
    const incomeLimit = grossIncome * 0.4;
    const deductionBase = Math.min(amount, incomeLimit);
    const deduction = Math.max(0, deductionBase - 2000);
    return Math.round(deduction);
};
const calculateWidowDeduction = (widowStatus) => {
    switch (widowStatus) {
        case 'single_parent': return { incomeTaxDeduction: 350000, residentTaxDeduction: 300000 };
        case 'widow': return { incomeTaxDeduction: 270000, residentTaxDeduction: 260000 };
        default: return { incomeTaxDeduction: 0, residentTaxDeduction: 0 };
    }
};
const calculateWorkingStudentDeduction = (workingStudentStatus) => {
    if (workingStudentStatus === 'yes') {
        return { incomeTaxDeduction: 270000, residentTaxDeduction: 260000 };
    }
    return { incomeTaxDeduction: 0, residentTaxDeduction: 0 };
};
const calculateDisabilityDeduction = (values) => {
    const generalCount = Number(values.generalDisabilityCount) || 0;
    const specialCount = Number(values.specialDisabilityCount) || 0;
    const severeCount = Number(values.severeDisabilityCount) || 0;
    const incomeTaxDeduction = generalCount * 270000 + specialCount * 400000 + severeCount * 750000;
    const residentTaxDeduction = generalCount * 260000 + specialCount * 300000 + severeCount * 530000;
    return { incomeTaxDeduction, residentTaxDeduction };
};

const calculateSpouseDeductions = (taxpayerIncome, spouseIncome, spouseStatus, spouseAge) => {
    const result = { spouseDeduction: 0, specialSpouseDeduction: 0, spouseDeductionForResidentTax: 0, specialSpouseDeductionForResidentTax: 0 };
    const taxpayerIncomeNum = Number(taxpayerIncome) || 0;
    const spouseIncomeNum = Number(spouseIncome) || 0;

    if (spouseStatus === 'none' || taxpayerIncomeNum > 10000000) {
        return result;
    }

    if (spouseIncomeNum <= 480000) {
        const isOver70 = spouseAge === 'over70';
        if (taxpayerIncomeNum <= 9000000) {
            result.spouseDeduction = isOver70 ? 480000 : 380000;
            result.spouseDeductionForResidentTax = isOver70 ? 380000 : 330000;
        } else if (taxpayerIncomeNum <= 9500000) {
            result.spouseDeduction = isOver70 ? 320000 : 260000;
            result.spouseDeductionForResidentTax = isOver70 ? 260000 : 220000;
        } else if (taxpayerIncomeNum <= 10000000) {
            result.spouseDeduction = isOver70 ? 160000 : 130000;
            result.spouseDeductionForResidentTax = isOver70 ? 130000 : 110000;
        }
    } 
    else if (spouseIncomeNum > 480000 && spouseIncomeNum <= 1330000) {
        if (taxpayerIncomeNum <= 9000000) {
            if (spouseIncomeNum <= 950000) { result.specialSpouseDeduction = 380000; result.specialSpouseDeductionForResidentTax = 330000; }
            else if (spouseIncomeNum <= 1000000) { result.specialSpouseDeduction = 360000; result.specialSpouseDeductionForResidentTax = 330000; }
            else if (spouseIncomeNum <= 1050000) { result.specialSpouseDeduction = 310000; result.specialSpouseDeductionForResidentTax = 310000; }
            else if (spouseIncomeNum <= 1100000) { result.specialSpouseDeduction = 260000; result.specialSpouseDeductionForResidentTax = 260000; }
            else if (spouseIncomeNum <= 1150000) { result.specialSpouseDeduction = 210000; result.specialSpouseDeductionForResidentTax = 210000; }
            else if (spouseIncomeNum <= 1200000) { result.specialSpouseDeduction = 160000; result.specialSpouseDeductionForResidentTax = 160000; }
            else if (spouseIncomeNum <= 1250000) { result.specialSpouseDeduction = 110000; result.specialSpouseDeductionForResidentTax = 110000; }
            else if (spouseIncomeNum <= 1300000) { result.specialSpouseDeduction = 60000; result.specialSpouseDeductionForResidentTax = 60000; }
            else if (spouseIncomeNum <= 1330000) { result.specialSpouseDeduction = 30000; result.specialSpouseDeductionForResidentTax = 30000; }
        }
        else if (taxpayerIncomeNum <= 9500000) {
            if (spouseIncomeNum <= 950000) { result.specialSpouseDeduction = 260000; result.specialSpouseDeductionForResidentTax = 220000; }
            else if (spouseIncomeNum <= 1000000) { result.specialSpouseDeduction = 240000; result.specialSpouseDeductionForResidentTax = 220000; }
            else if (spouseIncomeNum <= 1050000) { result.specialSpouseDeduction = 210000; result.specialSpouseDeductionForResidentTax = 210000; }
            else if (spouseIncomeNum <= 1100000) { result.specialSpouseDeduction = 180000; result.specialSpouseDeductionForResidentTax = 180000; }
            else if (spouseIncomeNum <= 1150000) { result.specialSpouseDeduction = 140000; result.specialSpouseDeductionForResidentTax = 140000; }
            else if (spouseIncomeNum <= 1200000) { result.specialSpouseDeduction = 110000; result.specialSpouseDeductionForResidentTax = 110000; }
            else if (spouseIncomeNum <= 1250000) { result.specialSpouseDeduction = 80000; result.specialSpouseDeductionForResidentTax = 80000; }
            else if (spouseIncomeNum <= 1300000) { result.specialSpouseDeduction = 40000; result.specialSpouseDeductionForResidentTax = 40000; }
            else if (spouseIncomeNum <= 1330000) { result.specialSpouseDeduction = 20000; result.specialSpouseDeductionForResidentTax = 20000; }
        }
        else if (taxpayerIncomeNum <= 10000000) {
            if (spouseIncomeNum <= 950000) { result.specialSpouseDeduction = 130000; result.specialSpouseDeductionForResidentTax = 110000; }
            else if (spouseIncomeNum <= 1000000) { result.specialSpouseDeduction = 120000; result.specialSpouseDeductionForResidentTax = 110000; }
            else if (spouseIncomeNum <= 1050000) { result.specialSpouseDeduction = 110000; result.specialSpouseDeductionForResidentTax = 110000; }
            else if (spouseIncomeNum <= 1100000) { result.specialSpouseDeduction = 90000; result.specialSpouseDeductionForResidentTax = 90000; }
            else if (spouseIncomeNum <= 1150000) { result.specialSpouseDeduction = 70000; result.specialSpouseDeductionForResidentTax = 70000; }
            else if (spouseIncomeNum <= 1200000) { result.specialSpouseDeduction = 60000; result.specialSpouseDeductionForResidentTax = 60000; }
            else if (spouseIncomeNum <= 1250000) { result.specialSpouseDeduction = 40000; result.specialSpouseDeductionForResidentTax = 40000; }
            else if (spouseIncomeNum <= 1300000) { result.specialSpouseDeduction = 20000; result.specialSpouseDeductionForResidentTax = 20000; }
            else if (spouseIncomeNum <= 1330000) { result.specialSpouseDeduction = 10000; result.specialSpouseDeductionForResidentTax = 10000; }
        }
    }
    return result;
};

const calculateDependentsDeduction = (values) => {
    const generalCount = Number(values.dependents16to18) || 0;
    const specificCount = Number(values.dependents19to22) || 0;
    const elderlyCount = Number(values.dependents70plus) || 0;
    const livingTogetherCount = Number(values.dependents70plusLivingTogether) || 0;
    const incomeTaxDeduction = generalCount * 380000 + specificCount * 630000 + elderlyCount * 480000 + livingTogetherCount * 580000;
    const residentTaxDeduction = generalCount * 330000 + specificCount * 450000 + elderlyCount * 380000 + livingTogetherCount * 450000;
    return { incomeTaxDeduction, residentTaxDeduction };
};
const calculateBusinessTax = (businessIncome, realEstateIncome) => {
    const incomeBase = (businessIncome || 0) + (realEstateIncome || 0);
    if (incomeBase === 0) return 0;
    const businessOwnerDeduction = 2900000;
    const taxableIncome = Math.max(0, incomeBase - businessOwnerDeduction);
    const taxRate = 0.05;
    const tax = taxableIncome * taxRate;
    return Math.floor(tax / 100) * 100;
};

// --- 税額計算 (変更なし) ---
const getIncomeTax = (taxableIncome) => {
    let baseTax = 0;
    if (taxableIncome <= 1950000) baseTax = taxableIncome * 0.05;
    else if (taxableIncome <= 3300000) baseTax = taxableIncome * 0.10 - 97500;
    else if (taxableIncome <= 6950000) baseTax = taxableIncome * 0.20 - 427500;
    else if (taxableIncome <= 9000000) baseTax = taxableIncome * 0.23 - 636000;
    else if (taxableIncome <= 18000000) baseTax = taxableIncome * 0.33 - 1536000;
    else if (taxableIncome <= 40000000) baseTax = taxableIncome * 0.40 - 2796000;
    else baseTax = taxableIncome * 0.45 - 4796000;
    const specialTax = baseTax * 0.021;
    const totalTax = Math.floor(baseTax + specialTax);
    return { baseTax: Math.floor(baseTax), specialTax: Math.floor(specialTax), totalTax: Math.floor(totalTax / 100) * 100 };
};
const getResidentTax = (taxableIncome) => {
    if (taxableIncome <= 0) {
        const perCapita = 5000;
        return { incomeProportional: 0, perCapita, totalTax: perCapita };
    }
    const incomeProportional = taxableIncome * 0.1;
    const perCapita = 5000;
    const totalTax = Math.floor(incomeProportional + perCapita);
    return { incomeProportional: Math.floor(incomeProportional), perCapita, totalTax: Math.floor(totalTax / 100) * 100 };
};
const calculateTax = (values, totalIncome, deductions, incomes) => {
    const commonDeductionsBase =
        (Number(values.socialInsuranceDeduction) || 0) +
        (Number(values.smallBizKyosai) || 0) +
        deductions.miscLossDeduction +
        deductions.medicalExpenseDeduction +
        deductions.donationDeduction;
    const totalDeductionsForIT =
        getBasicDeduction(totalIncome) + commonDeductionsBase +
        deductions.lifeInsuranceDeduction + deductions.earthquakeInsuranceDeduction +
        deductions.spouseDeduction + deductions.specialSpouseDeduction +
        deductions.widowDeduction + deductions.workingStudentDeduction +
        deductions.disabilityDeduction + deductions.dependentsDeduction;
    const taxableIncomeForIT = Math.floor(Math.max(0, totalIncome - totalDeductionsForIT) / 1000) * 1000;
    const incomeTaxResult = getIncomeTax(taxableIncomeForIT);
    const totalDeductionsForRT =
        getBasicDeductionForResidentTax(totalIncome) + commonDeductionsBase +
        deductions.lifeInsuranceDeductionForResidentTax + deductions.earthquakeInsuranceDeductionForResidentTax +
        deductions.spouseDeductionForResidentTax + deductions.specialSpouseDeductionForResidentTax +
        deductions.widowDeductionForResidentTax + deductions.workingStudentDeductionForResidentTax +
        deductions.disabilityDeductionForResidentTax + deductions.dependentsDeductionForResidentTax;
    const taxableIncomeForRT = Math.max(0, totalIncome - totalDeductionsForRT);
    const residentTaxResult = getResidentTax(taxableIncomeForRT);
    const businessTax = calculateBusinessTax(incomes.business, incomes.realEstate);
    return {
        incomeTax: incomeTaxResult.totalTax, incomeTaxBase: incomeTaxResult.baseTax, specialReconstructionTax: incomeTaxResult.specialTax,
        residentTax: residentTaxResult.totalTax, residentTaxIncomeProportional: residentTaxResult.incomeProportional, residentTaxPerCapita: residentTaxResult.perCapita,
        businessTax: businessTax, taxableIncome: taxableIncomeForIT, taxableIncomeForRT: taxableIncomeForRT, totalDeductions: totalDeductionsForIT,
    };
};

// --- 新UIコンポーネント (InputFieldを修正) ---
// New UI Components (InputField modified)

const formatNumber = (num) => Number(num || 0).toLocaleString();
const parseNumber = (str) => String(str).replace(/,/g, '');

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/60 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-sm transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title }) => (
  <div className="p-6 border-b border-gray-200/80">
    <h2 className="text-lg font-semibold text-[#1d1d1f]">{title}</h2>
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 space-y-6 ${className}`}>
    {children}
  </div>
);

const InputField = ({ label, name, value, onChange, disabled = false, subtext, unit = "円" }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-[#6e6e73] mb-1">{label}</label>
    <div className="relative">
      <input
        id={name} name={name} type="text"
        inputMode="decimal"
        value={formatNumber(value)} onChange={onChange} disabled={disabled}
        className="w-full px-3 py-2 bg-gray-100/80 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white text-[#1d1d1f] transition-all duration-200"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e6e73]">{unit}</span>
    </div>
    {subtext && <p className="mt-2 text-xs text-gray-500">{subtext}</p>}
  </div>
);

const ReadOnlyField = ({ label, value, unit = "円" }) => (
  <div>
    <label className="block text-sm font-medium text-[#6e6e73] mb-1">{label}</label>
    <div className="w-full px-3 py-2 bg-transparent rounded-lg text-[#1d1d1f] flex justify-between items-center">
      <span>{formatNumber(value)}</span>
      <span className="text-[#6e6e73]">{unit}</span>
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, subtext, disabled = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-[#6e6e73] mb-1">{label}</label>
    <select
      id={name} name={name} value={value} onChange={onChange} disabled={disabled}
      className="w-full px-3 py-2 bg-gray-100/80 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white text-[#1d1d1f] appearance-none transition-all duration-200"
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236e6e73' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    {subtext && <p className="mt-2 text-xs text-gray-500">{subtext}</p>}
  </div>
);

const PrimaryButton = ({ onClick, children }) => (
  <button onClick={onClick} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#007AFF] text-white font-semibold rounded-lg shadow-md hover:bg-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-opacity-75 transition-all duration-200">
    {children}
  </button>
);

const SecondaryButton = ({ onClick, children }) => (
  <button onClick={onClick} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200/80 text-[#1d1d1f] font-semibold rounded-lg hover:bg-gray-300/80 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-all duration-200">
    {children}
  </button>
);

// --- ページコンポーネント (変更なし) ---
// Page Components (Unchanged)

const IncomePage = ({ values, incomes, handleChange, onNavigate }) => (
    <div className="space-y-8">
        <Card>
            <CardHeader title="給与所得" />
            <CardContent><InputField label="給与収入" name="salaryRevenue" value={values.salaryRevenue} onChange={handleChange} /><ReadOnlyField label="給与所得控除" value={incomes.salaryDeduction} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="給与所得" value={incomes.salary} /></CardContent>
        </Card>
        <Card>
            <CardHeader title="不動産所得" />
            <CardContent><InputField label="収入金額" name="realEstateRevenue" value={values.realEstateRevenue} onChange={handleChange} /><InputField label="必要経費" name="realEstateExpenses" value={values.realEstateExpenses} onChange={handleChange} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="不動産所得" value={incomes.realEstate} /></CardContent>
        </Card>
        <Card>
            <CardHeader title="事業所得" />
            <CardContent><InputField label="収入金額" name="businessRevenue" value={values.businessRevenue} onChange={handleChange} /><InputField label="必要経費" name="businessExpenses" value={values.businessExpenses} onChange={handleChange} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="事業所得" value={incomes.business} /></CardContent>
        </Card>
        <Card>
            <CardHeader title="一時所得" />
            <CardContent><InputField label="総収入金額" name="temporaryRevenue" value={values.temporaryRevenue} onChange={handleChange} /><InputField label="支出した金額" name="temporaryExpenses" value={values.temporaryExpenses} onChange={handleChange} /><ReadOnlyField label="特別控除額" value={incomes.temporarySpecialDeduction} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="一時所得 (総所得金額への算入額)" value={incomes.temporary} /></CardContent>
        </Card>
        <Card>
            <CardHeader title="雑所得" />
            <CardContent>
                <SelectField label="公的年金の年齢区分" name="ageCategory" value={values.ageCategory} onChange={handleChange} options={[{value: 'none', label: '年金なし'}, {value: 'under65', label: '65歳未満'}, {value: 'over65', label: '65歳以上'}]} />
                <InputField label="公的年金等の収入金額" name="pensionRevenue" value={values.pensionRevenue} onChange={handleChange} disabled={values.ageCategory === 'none'} />
                <ReadOnlyField label="公的年金等に係る雑所得" value={incomes.publicPension} disabled={values.ageCategory === 'none'} />
                <hr className="border-t border-gray-200/80" />
                <InputField label="その他の雑所得の収入" name="otherMiscRevenue" value={values.otherMiscRevenue} onChange={handleChange} />
                <InputField label="必要経費" name="otherMiscExpenses" value={values.otherMiscExpenses} onChange={handleChange} />
                <hr className="border-t border-gray-200/80" />
                <ReadOnlyField label="雑所得合計" value={incomes.miscellaneous} />
            </CardContent>
        </Card>
        <Card>
            <CardHeader title="合計所得金額" />
            <CardContent>
                <SelectField label="青色申告特別控除額" name="blueDeduction" value={values.blueDeduction} onChange={handleChange} options={[{value: '0', label: '控除なし'}, {value: '650000', label: '65万円'}, {value: '550000', label: '55万円'}, {value: '100000', label: '10万円'}]} />
                <ReadOnlyField label="合計所得金額" value={incomes.totalIncome} />
            </CardContent>
        </Card>
        <div className="flex justify-end"><PrimaryButton onClick={() => onNavigate('deductions1')}>所得控除の入力へ <ChevronRight size={20} /></PrimaryButton></div>
    </div>
);

const DeductionsPage1 = ({ values, handleChange, onNavigate, deductions }) => (
    <div className="space-y-8">
        <h1 className="text-2xl font-bold text-[#1d1d1f]">所得控除の入力 (1/2)</h1>
        <Card><CardHeader title="雑損控除" /><CardContent><InputField label="損害金額" name="miscLossDamage" value={values.miscLossDamage} onChange={handleChange} /><InputField label="災害関連支出" name="miscLossDisaster" value={values.miscLossDisaster} onChange={handleChange} /><InputField label="保険金等" name="miscLossInsurance" value={values.miscLossInsurance} onChange={handleChange} /><ReadOnlyField label="差引損失額" value={deductions.miscLossNet} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="雑損控除額" value={deductions.miscLossDeduction} /></CardContent></Card>
        <Card><CardHeader title="医療費控除" /><CardContent><InputField label="支払った医療費の合計額" name="medicalPaid" value={values.medicalPaid} onChange={handleChange} /><InputField label="保険金等" name="medicalInsurance" value={values.medicalInsurance} onChange={handleChange} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="医療費控除額" value={deductions.medicalExpenseDeduction} /></CardContent></Card>
        <Card><CardHeader title="社会保険料控除" /><CardContent><InputField label="支払った掛金の合計額" name="socialInsuranceDeduction" value={values.socialInsuranceDeduction} onChange={handleChange} /></CardContent></Card>
        <Card><CardHeader title="小規模企業共済等掛金控除" /><CardContent><InputField label="支払った掛金の合計額" name="smallBizKyosai" value={values.smallBizKyosai} onChange={handleChange} /></CardContent></Card>
        <Card><CardHeader title="生命保険料控除" /><CardContent><InputField label="新生命保険料の支払額" name="lifeInsuranceNew" value={values.lifeInsuranceNew} onChange={handleChange} /><InputField label="介護医療保険料の支払額" name="nursingInsurance" value={values.nursingInsurance} onChange={handleChange} /><InputField label="新個人年金保険料の支払額" name="pensionInsuranceNew" value={values.pensionInsuranceNew} onChange={handleChange} /><InputField label="旧生命保険料の支払額" name="lifeInsuranceOld" value={values.lifeInsuranceOld} onChange={handleChange} /><InputField label="旧個人年金保険料の支払額" name="pensionInsuranceOld" value={values.pensionInsuranceOld} onChange={handleChange} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="生命保険料控除額" value={deductions.lifeInsuranceDeduction} /></CardContent></Card>
        <Card><CardHeader title="地震保険料控除" /><CardContent><InputField label="地震保険料の支払額" name="earthquakeInsurance" value={values.earthquakeInsurance} onChange={handleChange} /><InputField label="旧長期損害保険料の支払額" name="longTermNonLifeInsurance" value={values.longTermNonLifeInsurance} onChange={handleChange} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="地震保険料控除額" value={deductions.earthquakeInsuranceDeduction} /></CardContent></Card>
        <div className="mt-8 flex justify-between">
            <SecondaryButton onClick={() => onNavigate('income')}><ChevronLeft size={20} /> 所得の入力へ</SecondaryButton>
            <PrimaryButton onClick={() => onNavigate('deductions2')}>次へ進む <ChevronRight size={20} /></PrimaryButton>
        </div>
    </div>
);

const DeductionsPage2 = ({ values, handleChange, onNavigate, deductions }) => {
    const dependentOptions = useMemo(() => [
        {value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'},
        {value: 3, label: '3人'}, {value: 4, label: '4人'}, {value: 5, label: '5人'}
    ], []);
    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-[#1d1d1f]">所得控除の入力 (2/2)</h1>
            <Card><CardHeader title="寄付金控除" /><CardContent><InputField label="特定寄付金の支払額" name="donationAmount" value={values.donationAmount} onChange={handleChange} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="寄付金控除額" value={deductions.donationDeduction} /></CardContent></Card>
            <Card><CardHeader title="寡婦・ひとり親控除" /><CardContent><SelectField label="該当の判定" name="widowStatus" value={values.widowStatus} onChange={handleChange} options={[{value: 'none', label: '該当なし'}, {value: 'widow', label: '寡婦'}, {value: 'single_parent', label: 'ひとり親'}]} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="寡婦・ひとり親控除額" value={deductions.widowDeduction} /></CardContent></Card>
            <Card><CardHeader title="勤労学生控除" /><CardContent><SelectField label="該当の判定" name="workingStudentStatus" value={values.workingStudentStatus} onChange={handleChange} options={[{value: 'none', label: '該当なし'}, {value: 'yes', label: '該当あり'}]} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="勤労学生控除額" value={deductions.workingStudentDeduction} /></CardContent></Card>
            <Card><CardHeader title="障害者控除" /><CardContent><SelectField label="一般障害者の人数" name="generalDisabilityCount" value={values.generalDisabilityCount} onChange={handleChange} options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}, {value: 3, label: '3人'}]} /><SelectField label="特別障害者の人数" name="specialDisabilityCount" value={values.specialDisabilityCount} onChange={handleChange} options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}, {value: 3, label: '3人'}]} /><SelectField label="同居特別障害者の人数" name="severeDisabilityCount" value={values.severeDisabilityCount} onChange={handleChange} options={[{value: 0, label: '0人'}, {value: 1, label: '1人'}, {value: 2, label: '2人'}, {value: 3, label: '3人'}]} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="障害者控除額" value={deductions.disabilityDeduction} /></CardContent></Card>
            <Card><CardHeader title="配偶者控除・配偶者特別控除" /><CardContent><SelectField label="配偶者の有無" name="spouseStatus" value={values.spouseStatus} onChange={handleChange} options={[{value: 'none', label: 'なし'}, {value: 'yes', label: 'あり'}]} /><SelectField label="配偶者の年齢" name="spouseAge" value={values.spouseAge} onChange={handleChange} disabled={values.spouseStatus === 'none'} options={[{value: 'under70', label: '70歳未満'}, {value: 'over70', label: '70歳以上'}]} /><InputField label="配偶者の合計所得金額" name="spouseIncome" value={values.spouseIncome} onChange={handleChange} disabled={values.spouseStatus === 'none'} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="配偶者控除額" value={deductions.spouseDeduction} /><ReadOnlyField label="配偶者特別控除額" value={deductions.specialSpouseDeduction} /></CardContent></Card>
            <Card><CardHeader title="扶養控除" /><CardContent><SelectField label="一般扶養親族の人数 (16~18歳)" name="dependents16to18" value={values.dependents16to18} onChange={handleChange} options={dependentOptions} /><SelectField label="特定扶養親族の人数 (19~22歳)" name="dependents19to22" value={values.dependents19to22} onChange={handleChange} options={dependentOptions} /><SelectField label="老人扶養親族の人数 (70歳以上)" name="dependents70plus" value={values.dependents70plus} onChange={handleChange} options={dependentOptions} /><SelectField label="同居老親等の人数 (70歳以上)" name="dependents70plusLivingTogether" value={values.dependents70plusLivingTogether} onChange={handleChange} options={dependentOptions} /><hr className="border-t border-gray-200/80" /><ReadOnlyField label="扶養控除額" value={deductions.dependentsDeduction} /></CardContent></Card>
            <div className="mt-8 flex justify-between">
                <SecondaryButton onClick={() => onNavigate('deductions1')}><ChevronLeft size={20} /> 前のページへ</SecondaryButton>
                <PrimaryButton onClick={() => onNavigate('taxCalculation')}>税額計算の内訳へ <ChevronRight size={20} /></PrimaryButton>
            </div>
        </div>
    );
};

const TaxCalculationPage = ({ incomes, tax, onNavigate }) => (
    <div className="space-y-8">
        <h1 className="text-2xl font-bold text-[#1d1d1f]">税額の計算</h1>
        <Card>
            <CardHeader title="1. 課税所得金額の計算" />
            <CardContent className="text-sm">
                <div className="flex justify-between items-center"><span>合計所得金額</span> <span>{formatNumber(incomes.totalIncome)} 円</span></div>
                <div className="flex justify-between items-center text-red-600"><span>(-) 所得控除合計</span> <span>{formatNumber(tax.totalDeductions)} 円</span></div>
                <hr className="my-2 border-t-2 border-gray-200/80" />
                <div className="flex justify-between items-center font-bold text-lg text-[#1d1d1f]"><span>課税所得金額</span> <span>{formatNumber(tax.taxableIncome)} 円</span></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader title="2. 所得税額の計算" />
            <CardContent className="text-sm">
                <div className="flex justify-between items-center"><span>課税所得金額 × 税率 - 控除額</span> <span>{formatNumber(tax.incomeTaxBase)} 円</span></div>
                <div className="flex justify-between items-center"><span>(+) 復興特別所得税 (2.1%)</span> <span>{formatNumber(tax.specialReconstructionTax)} 円</span></div>
                <hr className="my-2 border-t-2 border-gray-200/80" />
                <div className="flex justify-between items-center font-bold text-lg text-red-600"><span>所得税額</span> <span>{formatNumber(tax.incomeTax)} 円</span></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader title="3. 住民税額の計算" />
            <CardContent className="text-sm">
                 <div className="flex justify-between items-center"><span>課税所得金額(住民税)</span> <span>{formatNumber(tax.taxableIncomeForRT)} 円</span></div>
                 <div className="flex justify-between items-center"><span>所得割 (10%)</span> <span>{formatNumber(tax.residentTaxIncomeProportional)} 円</span></div>
                 <div className="flex justify-between items-center"><span>(+) 均等割</span> <span>{formatNumber(tax.residentTaxPerCapita)} 円</span></div>
                 <hr className="my-2 border-t-2 border-gray-200/80" />
                 <div className="flex justify-between items-center font-bold text-lg text-green-600"><span>住民税額</span> <span>{formatNumber(tax.residentTax)} 円</span></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader title="【免責事項】" />
            <CardContent className="text-xs text-[#6e6e73] space-y-2">
                <p>・本アプリの計算結果は、あくまで概算です。正確性を保証するものではありません。</p>
                <p>・本アプリの利用により生じたいかなる損害についても、開発者は一切の責任を負いません。</p>
                <p>・正確な税額については、税務署または税理士にご相談ください。</p>
            </CardContent>
        </Card>
        <div className="mt-8 flex justify-start">
            <SecondaryButton onClick={() => onNavigate('deductions2')}><ChevronLeft size={20} /> 所得控除の入力へ</SecondaryButton>
        </div>
    </div>
);


// --- メインコンポーネント ---
// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('income');
  
  // Initial state values are unchanged
  const [values, setValues] = useState({
    salaryRevenue: 0, realEstateRevenue: 0, realEstateExpenses: 0,
    businessRevenue: 0, businessExpenses: 0, temporaryRevenue: 0, temporaryExpenses: 0,
    ageCategory: 'none', pensionRevenue: 0, otherMiscRevenue: 0, otherMiscExpenses: 0,
    blueDeduction: '0', socialInsuranceDeduction: 0, smallBizKyosai: 0,
    lifeInsuranceNew: 0, nursingInsurance: 0, pensionInsuranceNew: 0, lifeInsuranceOld: 0, pensionInsuranceOld: 0,
    earthquakeInsurance: 0, longTermNonLifeInsurance: 0,
    miscLossDamage: 0, miscLossDisaster: 0, miscLossInsurance: 0,
    medicalPaid: 0, medicalInsurance: 0, donationAmount: 0,
    widowStatus: 'none', workingStudentStatus: 'none',
    generalDisabilityCount: 0, specialDisabilityCount: 0, severeDisabilityCount: 0,
    spouseStatus: 'none', spouseAge: 'under70', spouseIncome: 0,
    dependents16to18: 0, dependents19to22: 0, dependents70plus: 0, dependents70plusLivingTogether: 0,
  });

  const [incomes, setIncomes] = useState({
    salary: 0, salaryDeduction: 0, realEstate: 0, business: 0,
    temporary: 0, temporarySpecialDeduction: 0,
    publicPension: 0, otherMisc: 0, miscellaneous: 0,
    grossIncome: 0, totalIncome: 0, applicableBlueDeduction: 0,
  });

  const [deductions, setDeductions] = useState({
      miscLossNet: 0, miscLossDeduction: 0, medicalExpenseDeduction: 0,
      lifeInsuranceDeduction: 0, lifeInsuranceDeductionForResidentTax: 0,
      earthquakeInsuranceDeduction: 0, earthquakeInsuranceDeductionForResidentTax: 0,
      donationDeduction: 0, widowDeduction: 0, widowDeductionForResidentTax: 0,
      workingStudentDeduction: 0, workingStudentDeductionForResidentTax: 0,
      disabilityDeduction: 0, disabilityDeductionForResidentTax: 0,
      spouseDeduction: 0, specialSpouseDeduction: 0,
      spouseDeductionForResidentTax: 0, specialSpouseDeductionForResidentTax: 0,
      dependentsDeduction: 0, dependentsDeductionForResidentTax: 0,
  });

  const [tax, setTax] = useState({
      incomeTax: 0, incomeTaxBase: 0, specialReconstructionTax: 0,
      residentTax: 0, residentTaxIncomeProportional: 0, residentTaxPerCapita: 0,
      businessTax: 0, taxableIncome: 0, taxableIncomeForRT: 0, totalDeductions: 0,
  });

  const handleNavigate = (page) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = e.target.tagName === 'SELECT' ? value : parseNumber(value);
    setValues(prev => ({ ...prev, [name]: parsedValue }));
  };

  // useEffect for calculations: Unchanged
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
    const temporaryIncome = Math.round(temporaryBeforeHalf / 2);
    const otherMiscIncome = Math.max(0, (Number(values.otherMiscRevenue) || 0) - (Number(values.otherMiscExpenses) || 0));

    const otherIncomeForPensionCalc = salaryIncome + reIncome + businessIncome + temporaryBeforeHalf + otherMiscIncome;
    
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
    // Corrected spouse deduction calculation
    const spouseResult = calculateSpouseDeductions(totalIncome, values.spouseIncome, values.spouseStatus, values.spouseAge);
    const donationResult = calculateDonationDeduction(values.donationAmount, grossIncome);
    const widowResult = calculateWidowDeduction(values.widowStatus);
    const workingStudentResult = calculateWorkingStudentDeduction(values.workingStudentStatus);
    const disabilityResult = calculateDisabilityDeduction(values);
    const dependentsResult = calculateDependentsDeduction(values);
    setDeductions({
        miscLossNet: miscLossResult.netLoss, miscLossDeduction: miscLossResult.deduction, medicalExpenseDeduction: medicalDeductionResult,
        lifeInsuranceDeduction: lifeInsuranceResult.incomeTaxDeduction, lifeInsuranceDeductionForResidentTax: lifeInsuranceResult.residentTaxDeduction,
        earthquakeInsuranceDeduction: earthquakeInsuranceResult.incomeTaxDeduction, earthquakeInsuranceDeductionForResidentTax: earthquakeInsuranceResult.residentTaxDeduction,
        donationDeduction: donationResult, widowDeduction: widowResult.incomeTaxDeduction, widowDeductionForResidentTax: widowResult.residentTaxDeduction,
        workingStudentDeduction: workingStudentResult.incomeTaxDeduction, workingStudentDeductionForResidentTax: workingStudentResult.residentTaxDeduction,
        disabilityDeduction: disabilityResult.incomeTaxDeduction, disabilityDeductionForResidentTax: disabilityResult.residentTaxDeduction,
        spouseDeduction: spouseResult.spouseDeduction, specialSpouseDeduction: spouseResult.specialSpouseDeduction,
        spouseDeductionForResidentTax: spouseResult.spouseDeductionForResidentTax, specialSpouseDeductionForResidentTax: spouseResult.specialSpouseDeductionForResidentTax,
        dependentsDeduction: dependentsResult.incomeTaxDeduction, dependentsDeductionForResidentTax: dependentsResult.residentTaxDeduction,
    });
  }, [values]);

  useEffect(() => {
    const taxResult = calculateTax(values, incomes.totalIncome, deductions, incomes);
    setTax(taxResult);
  }, [values, incomes, deductions]);

  const CalculationResult = () => (
    <div className="lg:col-span-1">
        <div className="sticky top-8 space-y-6">
            <Card className="p-6">
                <h2 className="text-xl font-bold text-[#1d1d1f] text-center mb-6">計算結果</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg text-[#1d1d1f] border-b border-gray-200/80 pb-2 mb-2">所得金額</h3>
                        <div className="space-y-1 text-sm text-[#6e6e73]">
                            <p className="flex justify-between">給与所得: <span>{formatNumber(incomes.salary)}円</span></p>
                            <p className="flex justify-between">不動産所得: <span>{formatNumber(incomes.realEstate)}円</span></p>
                            <p className="flex justify-between">事業所得: <span>{formatNumber(incomes.business)}円</span></p>
                            <p className="flex justify-between">一時所得: <span>{formatNumber(incomes.temporary)}円</span></p>
                            <p className="flex justify-between">雑所得: <span>{formatNumber(incomes.miscellaneous)}円</span></p>
                            <hr className="my-2 border-gray-200/80"/>
                            <p className="flex justify-between text-blue-600">▲ 青色申告特別控除: <span>{formatNumber(incomes.applicableBlueDeduction)}円</span></p>
                            <p className="flex justify-between font-bold text-base text-[#1d1d1f] mt-2">合計所得金額: <span>{formatNumber(incomes.totalIncome)}円</span></p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-[#1d1d1f] border-b border-gray-200/80 pb-2 mb-2">課税所得</h3>
                        <div className="space-y-1 text-sm text-[#6e6e73]">
                            <p className="flex justify-between">合計所得金額: <span>{formatNumber(incomes.totalIncome)}円</span></p>
                            <p className="flex justify-between">▲ 所得控除合計: <span>{formatNumber(tax.totalDeductions)}円</span></p>
                            <hr className="my-2 border-gray-200/80"/>
                            <p className="flex justify-between font-bold text-base text-[#1d1d1f] mt-2">課税所得金額: <span>{formatNumber(tax.taxableIncome)}円</span></p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-[#1d1d1f] border-b border-gray-200/80 pb-2 mb-2">最終税額</h3>
                        <div className="space-y-3 mt-4">
                            <p className="flex justify-between items-baseline text-red-600 font-bold text-2xl"><span>所得税</span> <span>{formatNumber(tax.incomeTax)}円</span></p>
                            <p className="flex justify-between items-baseline text-green-600 font-bold text-2xl"><span>住民税</span> <span>{formatNumber(tax.residentTax)}円</span></p>
                            <p className="flex justify-between items-baseline text-purple-600 font-bold text-2xl"><span>事業税</span> <span>{formatNumber(tax.businessTax)}円</span></p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
        case 'income': return <IncomePage values={values} incomes={incomes} handleChange={handleChange} onNavigate={handleNavigate} />;
        case 'deductions1': return <DeductionsPage1 values={values} handleChange={handleChange} onNavigate={handleNavigate} deductions={deductions} />;
        case 'deductions2': return <DeductionsPage2 values={values} handleChange={handleChange} onNavigate={handleNavigate} deductions={deductions} />;
        case 'taxCalculation': return <TaxCalculationPage incomes={incomes} tax={tax} onNavigate={handleNavigate} />;
        default: return <IncomePage values={values} incomes={incomes} handleChange={handleChange} onNavigate={handleNavigate} />;
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[#f5f5f7] font-sans text-[#1d1d1f]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-[#1d1d1f]">
              個人事業主の税額シミュレーション
            </h1>
            <p className="mt-2 text-lg text-[#6e6e73]">
              個人事業主の所得税・住民税・事業税を自動計算します。
            </p>
          </header>
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {renderPage()}
            </div>
            <CalculationResult />
          </main>
        </div>
      </div>
      <Analytics />
    </>
  );
}

export default App;
