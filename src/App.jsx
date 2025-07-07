// src/App.jsx
import React, { useState } from 'react';
import IncomeForm from './components/IncomeForm';
import { calculateTax, getSalaryDeduction } from './utils/taxCalculator';

function App() {
  const [values, setValues] = useState({
    salary: 0,
    pensionIncome: 0,
    ageCategory: 'none',
    otherIncome: 0,
    miscExpenses: 0,
    basicDeduction: 480000,
    spouseDeduction: 0,
    socialInsurance: 0,
    lifeInsurance: 0,
    propertyIncomeTotal: 0,
    propertyExpenses: 0,
    businessIncome: 0,
    businessExpenses: 0,
    temporaryIncomeGross: 0,
    temporaryIncomeExpenses: 0,
  });
  const [result, setResult] = useState(null);

  // 給与所得控除と給与所得
  const salaryDeduction = getSalaryDeduction(values.salary);
  const salaryIncome = Math.max(0, values.salary - salaryDeduction);

  // 入力ハンドラ: select は文字列、checkbox は boolean、それ以外は数値化
  const onChange = e => {
    const { name, value, type, checked } = e.target;
    let newValue;
    if (type === 'checkbox') {
      newValue = checked;
    } else if (name === 'ageCategory') {
      newValue = value;
    } else {
      const raw = value.replace(/,/g, '');
      newValue = raw === '' ? 0 : Number(raw);
    }
    setValues(v => ({ ...v, [name]: newValue }));
  };

  const onSubmit = e => {
    e.preventDefault();
    setResult(
      calculateTax({
        salary: values.salary,
        pension: values.pensionIncome,
        socialInsurance: values.socialInsurance,
        lifeInsurance: values.lifeInsurance,
        basicDeduction: values.basicDeduction,
        spouseDeduction: values.spouseDeduction,
        propertyIncomeTotal: values.propertyIncomeTotal,
        propertyExpenses: values.propertyExpenses,
        businessIncome: values.businessIncome,
        businessExpenses: values.businessExpenses,
        temporaryIncomeGross: values.temporaryIncomeGross,
        temporaryIncomeExpenses: values.temporaryIncomeExpenses,
        miscIncomeGross: values.pensionIncome - (['none'].includes(values.ageCategory) ? 0 : values.pensionIncome) + values.otherIncome,
        miscIncomeExpenses: values.miscExpenses,
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10">
      <h1 className="text-3xl font-bold mb-6 text-center">所得税・住民税シミュレーション</h1>
      <IncomeForm
        values={values}
        onChange={onChange}
        onSubmit={onSubmit}
        salaryDeduction={salaryDeduction}
        salaryIncome={salaryIncome}
      />
      {result && (
        <div className="max-w-md mx-auto mt-6 bg-white p-4 rounded shadow space-y-2">
          {/* 結果表示省略 */}
        </div>
      )}
    </div>
  );
}

export default App;
