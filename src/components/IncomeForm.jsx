// src/components/IncomeForm.jsx
import React from 'react';

// Helper to format numbers with commas
function formatNumber(value) {
    return typeof value === 'number' && !isNaN(value) ? value.toLocaleString() : '';
}

export default function IncomeForm({ values, onChange, onSubmit, salaryDeduction, salaryIncome }) {
    // 一時所得の計算
    const rawTemp = Math.max(0, values.temporaryIncomeGross - values.temporaryIncomeExpenses);
    const tempSpecial = Math.min(500000, rawTemp);
    const tempNet = Math.max(0, (rawTemp - tempSpecial) / 2);

    // 公的年金等控除額計算の新ロジック
    const pensionIncome = values.pensionIncome || 0;
    let pensionDeduction = 0;
    if (values.ageCategory === 'under65') {
        if (pensionIncome < 1300000) pensionDeduction = 600000;
        else if (pensionIncome < 4100000) pensionDeduction = pensionIncome * 0.25 + 275000;
        else if (pensionIncome < 7700000) pensionDeduction = pensionIncome * 0.15 + 685000;
        else if (pensionIncome < 10000000) pensionDeduction = pensionIncome * 0.05 + 1455000;
        else pensionDeduction = 1955000;
    } else if (values.ageCategory === 'over65') {
        if (pensionIncome < 3300000) pensionDeduction = 1100000;
        else if (pensionIncome < 4100000) pensionDeduction = pensionIncome * 0.25 + 275000;
        else if (pensionIncome < 7700000) pensionDeduction = pensionIncome * 0.15 + 685000;
        else if (pensionIncome < 10000000) pensionDeduction = pensionIncome * 0.05 + 1455000;
        else pensionDeduction = 1955000;
    }


    // 雑所得の計算項目
    const otherIncome = values.otherIncome || 0;
    const miscExpenses = values.miscExpenses || 0;
    const miscNetIncome = Math.max(
        0,
        (values.ageCategory === 'none' ? 0 : pensionIncome - pensionDeduction) + otherIncome - miscExpenses
    );

    // 不動産所得、事業所得のネット
    const propertyNet = Math.max(0, values.propertyIncomeTotal - values.propertyExpenses);
    const businessNet = Math.max(0, values.businessIncome - values.businessExpenses);

    // 合計所得金額処理
    const grossIncome =
        salaryIncome +
        (values.ageCategory === 'none' ? 0 : pensionIncome) +
        propertyNet +
        businessNet +
        tempNet +
        miscNetIncome;
    const totalIncome = Math.max(0, grossIncome - (values.blueDeduction || 0));

    const pensionEnabled = ['under65', 'over65'].includes(values.ageCategory);

    return (
        <form onSubmit={onSubmit} className="max-w-md mx-auto p-6 space-y-6 bg-white rounded-lg shadow">
            {/* 給与所得ブロック */}
            <fieldset className="p-4 border rounded-lg space-y-4">
                <legend className="font-semibold">給与所得の計算</legend>
                <div>
                    <label htmlFor="salary" className="block mb-1 font-medium">給与収入 (円)</label>
                    <input id="salary" name="salary" type="text" value={formatNumber(values.salary)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="salaryDeduction" className="block mb-1 font-medium">給与所得控除 (円)</label>
                    <input id="salaryDeduction" name="salaryDeduction" type="text" value={formatNumber(salaryDeduction)} readOnly
                        className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="salaryIncome" className="block mb-1 font-medium">給与所得 (円)</label>
                    <input id="salaryIncome" name="salaryIncome" type="text" value={formatNumber(salaryIncome)} readOnly
                        className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
            </fieldset>

            {/* 不動産所得ブロック */}
            <fieldset className="p-4 border rounded-lg space-y-4">
                <legend className="font-semibold">不動産所得の計算</legend>
                <div>
                    <label htmlFor="propertyIncomeTotal" className="block mb-1 font-medium">収入金額 (円)</label>
                    <input id="propertyIncomeTotal" name="propertyIncomeTotal" type="text" value={formatNumber(values.propertyIncomeTotal)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="propertyExpenses" className="block mb-1 font-medium">必要経費 (円)</label>
                    <input id="propertyExpenses" name="propertyExpenses" type="text" value={formatNumber(values.propertyExpenses)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="propertyNet" className="block mb-1 font-medium">青色申告特別控除前の不動産所得 (円)</label>
                    <input id="propertyNet" name="propertyNet" type="text" value={formatNumber(propertyNet)} readOnly
                        className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
            </fieldset>

            {/* 事業所得ブロック */}
            <fieldset className="p-4 border rounded-lg space-y-4">
                <legend className="font-semibold">事業所得の計算</legend>
                <div>
                    <label htmlFor="businessIncome" className="block mb-1 font-medium">総収入金額 (円)</label>
                    <input id="businessIncome" name="businessIncome" type="text" value={formatNumber(values.businessIncome)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="businessExpenses" className="block mb-1 font-medium">必要経費 (円)</label>
                    <input id="businessExpenses" name="businessExpenses" type="text" value={formatNumber(values.businessExpenses)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="businessNet" className="block mb-1 font-medium">青色申告特別控除前の事業所得 (円)</label>
                    <input id="businessNet" name="businessNet" type="text" value={formatNumber(businessNet)} readOnly
                        className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
            </fieldset>

            {/* 一時所得ブロック */}
            <fieldset className="p-4 border rounded-lg space-y-4">
                <legend className="font-semibold">一時所得の計算</legend>
                <div>
                    <label htmlFor="temporaryIncomeGross" className="block mb-1 font-medium">総収入金額 (円)</label>
                    <input id="temporaryIncomeGross" name="temporaryIncomeGross" type="text" value={formatNumber(values.temporaryIncomeGross)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="temporaryIncomeExpenses" className="block mb-1 font-medium">必要経費 (円)</label>
                    <input id="temporaryIncomeExpenses" name="temporaryIncomeExpenses" type="text" value={formatNumber(values.temporaryIncomeExpenses)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="temporarySpecial" className="block mb-1 font-medium">特別控除額 (円)</label>
                    <input id="temporarySpecial" name="temporarySpecialDeduction" type="text" value={formatNumber(tempSpecial)} readOnly
                        className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="temporaryNetIncome" className="block mb-1 font-medium">一時所得 (収入−経費−特別控除)×1/2 (円)</label>
                    <input id="temporaryNetIncome" name="temporaryNetIncome" type="text" value={formatNumber(tempNet)} readOnly
                        className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
            </fieldset>

            {/* 雑所得ブロック */}
            <fieldset className="p-4 border rounded-lg space-y-4">
                <legend className="font-semibold">雑所得の計算</legend>
                <div>
                    <label htmlFor="ageCategory" className="block mb-1 font-medium">本人の年齢区分</label>
                    <select id="ageCategory" name="ageCategory" value={values.ageCategory} onChange={onChange}
                        className="w-full border rounded px-3 py-2">
                        <option value="none">年金なし</option>
                        <option value="under65">65歳未満</option>
                        <option value="over65">65歳以上</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="pensionIncome" className="block mb-1 font-medium">公的年金等の収入金額 (円)</label>
                    <input id="pensionIncome" name="pensionIncome" type="text" value={formatNumber(pensionIncome)} onChange={onChange}
                        disabled={!pensionEnabled} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="pensionDeduction" className="block mb-1 font-medium">公的年金等の控除額 (円)</label>
                    <input id="pensionDeduction" name="pensionDeduction" type="text" value={formatNumber(pensionDeduction)} readOnly
                        disabled={!pensionEnabled} className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="otherIncome" className="block mb-1 font-medium">公的年金等以外の収入金額 (円)</label>
                    <input id="otherIncome" name="otherIncome" type="text" value={formatNumber(otherIncome)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="miscExpenses" className="block mb-1 font-medium">必要経費 (円)</label>
                    <input id="miscExpenses" name="miscExpenses" type="text" value={formatNumber(miscExpenses)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="miscNetIncome" className="block mb-1 font-medium">雑所得 (円)</label>
                    <input id="miscNetIncome" name="miscNetIncome" type="text" value={formatNumber(miscNetIncome)} readOnly
                        className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
            </fieldset>

            {/* 合計所得金額ブロック */}
            <fieldset className="p-4 border rounded-lg space-y-4">
                <legend className="font-semibold">合計所得金額の計算</legend>
                <div>
                    <label htmlFor="blueDeduction" className="block mb-1 font-medium">青色申告特別控除額 (円)</label>
                    <select id="blueDeduction" name="blueDeduction" value={values.blueDeduction} onChange={onChange}
                        className="w-full border rounded px-3 py-2">
                        <option value={0}>0</option>
                        <option value={100000}>100,000</option>
                        <option value={550000}>550,000</option>
                        <option value={650000}>650,000</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="totalIncome" className="block mb-1 font-medium">合計所得金額 (円)</label>
                    <input id="totalIncome" name="totalIncome" type="text" value={formatNumber(totalIncome)} readOnly
                        className="w-full border rounded bg-gray-100 px-3 py-2" />
                </div>
            </fieldset>

            {/* 控除ブロックと送信ボタン */}
            <fieldset className="p-4 border rounded-lg space-y-4">
                <div>
                    <label htmlFor="basicDeduction" className="block mb-1 font-medium">基礎控除 (円)</label>
                    <input id="basicDeduction" name="basicDeduction" type="text" value={formatNumber(values.basicDeduction)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="socialInsurance" className="block mb-1 font-medium">社会保険料控除額 (円)</label>
                    <input id="socialInsurance" name="socialInsurance" type="text" value={formatNumber(values.socialInsurance)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="lifeInsurance" className="block mb-1 font-medium">生命保険料控除額 (円)</label>
                    <input id="lifeInsurance" name="lifeInsurance" type="text" value={formatNumber(values.lifeInsurance)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="spouseDeduction" className="block mb-1 font-medium">配偶者控除額 (円)</label>
                    <input id="spouseDeduction" name="spouseDeduction" type="text" value={formatNumber(values.spouseDeduction)} onChange={onChange}
                        className="w-full border rounded px-3 py-2" />
                </div>
            </fieldset>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">計算する</button>
        </form>
    );
}
