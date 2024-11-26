const express = require('express');
const fs = require('fs');
const app = express();
const port = 4001;

// تحميل بيانات اللوحات من ملف JSON
const platesData = JSON.parse(fs.readFileSync('./plates.json', 'utf-8'));

// دالة لحساب متوسط السعر
function calculateAveragePrice(similarPlates) {
    const total = similarPlates.reduce((sum, plate) => sum + parseInt(plate.price), 0);
    return (total / similarPlates.length).toFixed(2);
}

// دالة للتحقق من تشابه الأرقام
function isSimilarNumber(inputNumber, targetNumber) {
    const inputStr = inputNumber.toString();
    const targetStr = targetNumber.toString();
    return inputStr.length === targetStr.length && targetStr.includes(inputStr.slice(0, 2));
}

// نقطة نهاية البحث عن لوحة مشابهة
app.get('/api/plates/:character/:number', (req, res) => {
    const { character, number } = req.params;
    const numberLength = number.length;

    // البحث عن لوحات مطابقة من حيث الحرف، وعدد الأرقام، وقريبة من الأرقام المدخلة
    let similarPlates = platesData.filter(plate => 
        plate.character.toLowerCase() === character.toLowerCase() &&
        plate.number.toString().length === numberLength &&
        isSimilarNumber(number, plate.number)
    );

    // إذا لم يتم العثور على نتائج، يجلب لوحات بنفس الحرف وعدد الأرقام من نفس الإمارة
    if (similarPlates.length === 0) {
        similarPlates = platesData.filter(plate => 
            plate.character.toLowerCase() === character.toLowerCase() &&
            plate.number.toString().length === numberLength
        );
    }

    // إذا كانت هناك نتائج، احسب متوسط السعر وأعد البيانات
    const averagePrice = calculateAveragePrice(similarPlates);
    res.json({
        estimatedPrice: averagePrice,
        similarPlates: similarPlates
    });
});

// بدء الخادم
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
