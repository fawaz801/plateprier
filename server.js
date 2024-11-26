const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 4001;

// استخدام CORS للسماح بالاتصالات عبر النطاقات المختلفة
app.use(cors());

// تحميل بيانات اللوحات من ملف JSON
const platesData = JSON.parse(fs.readFileSync('./plates.json', 'utf-8'));

// دالة لحساب متوسط السعر من اللوحات المماثلة
function calculateAveragePrice(similarPlates) {
    if (similarPlates.length === 0) return "Not Available"; // إذا لم يتم العثور على لوحات مشابهة، يتم إرجاع هذه الرسالة
    const total = similarPlates.reduce((sum, plate) => sum + parseInt(plate.price), 0);
    return (total / similarPlates.length).toFixed(2); // إرجاع متوسط السعر بعد تقريبه إلى منزلتين عشريتين
}

// دالة للتحقق إذا كانت الأرقام مشابهة (استنادًا إلى أكبر عدد ممكن من الأرقام المتشابهة)
function isSimilarNumber(inputNumber, targetNumber) {
    const inputStr = inputNumber.toString();
    const targetStr = targetNumber.toString();

    // التأكد من أن الرقم المدخل ليس أطول من الرقم المخزن
    if (inputStr.length > targetStr.length) return false;

    // مقارنة الأرقام باستخدام النسبة المئوية للتشابه
    let matchCount = 0;
    for (let i = 0; i < targetStr.length; i++) {
        if (inputStr[i] === targetStr[i]) {
            matchCount++;
        }
    }

    const matchPercentage = (matchCount / targetStr.length) * 100;

    // إذا كانت نسبة التشابه أكبر من 50%، يتم اعتبار الأرقام متشابهة
    return matchPercentage > 50;
}

// دالة لتحسين البحث عن اللوحات المشابهة
function findSimilarPlates(number, character) {
    const numberLength = number.length;

    let similarPlates = [];

    // البحث باستخدام الأرقام كاملة (من 5 إلى 1 رقم)
    for (let i = numberLength; i > 0; i--) {
        let currentNumber = number.slice(0, i);

        // البحث أولاً باستخدام الرقم المحدد وحرف معين
        similarPlates = platesData.filter(plate =>
            plate.character.toLowerCase() === character.toLowerCase() &&
            plate.number.toString().startsWith(currentNumber) &&
            isSimilarNumber(currentNumber, plate.number)
        );

        // إذا تم العثور على تطابقات، نوقف البحث
        if (similarPlates.length > 0) break;
    }

    // إذا لم يتم العثور على تطابقات باستخدام الحرف، حاول البحث عن الأرقام فقط
    if (similarPlates.length === 0) {
        for (let i = numberLength; i > 0; i--) {
            let currentNumber = number.slice(0, i);

            similarPlates = platesData.filter(plate =>
                plate.number.toString().startsWith(currentNumber) &&
                isSimilarNumber(currentNumber, plate.number)
            );

            // إذا تم العثور على تطابقات، نوقف البحث
            if (similarPlates.length > 0) break;
        }
    }

    return similarPlates;
}

// نقطة نهاية البحث عن لوحة مشابهة
app.get('/api/plates/:character/:number', (req, res) => {
    let { character, number } = req.params;

    // التحقق من أن الحرف فارغ أو "no-letter" (يعني لا يوجد حرف محدد)
    if (character === "no-letter") {
        let similarPlates = platesData.filter(plate =>
            plate.number.toString() === number && plate.character === ""
        );

        const averagePrice = calculateAveragePrice(similarPlates);
        res.json({
            estimatedPrice: averagePrice,
            similarPlates: similarPlates.slice(0, 3) // عرض 3 اقتراحات فقط
        });
    } else {
        // البحث عن اللوحات المشابهة
        let similarPlates = findSimilarPlates(number, character);

        // إذا لم يتم العثور على لوحات مشابهة، أرسل رسالة بأن النتائج غير موجودة
        if (similarPlates.length === 0) {
            res.json({
                estimatedPrice: "Not Available",
                similarPlates: []
            });
        } else {
            const averagePrice = calculateAveragePrice(similarPlates);
            res.json({
                estimatedPrice: averagePrice,
                similarPlates: similarPlates.slice(0, 3) // عرض 3 اقتراحات فقط
            });
        }
    }
});

// المسار الجذر لعرض رسالة عند زيارة الموقع مباشرة
app.get('/', (req, res) => {
    res.send('Welcome to the License Plate Pricing API');
});

// بدء الخادم
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
