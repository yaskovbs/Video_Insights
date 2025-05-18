# הוראות להעלאת VideoInsights ל-Netlify

## הכנת הפרויקט לפני העלאה

1. **בדיקת הגדרות**:
   - ודא שכל הנתיבים לקבצים הם נתיבים יחסיים ולא מוחלטים
   - בדוק שקובץ `netlify.toml` קיים ומוגדר נכון

2. **בקשות API**:
   - שים לב שהפרונטאנד מנסה להתחבר ל-`http://localhost:3000`
   - בעת העלאה ל-Netlify, תצטרך לשנות את הכתובת לשרת שמארח את ה-API

## אפשרויות להתמודדות עם צד השרת

יש לך שתי אפשרויות עיקריות:

### 1. העלאת השרת לשירות נפרד (מומלץ)

שירותים מומלצים להעלאת שרת Node.js:
- **Render** (https://render.com) - יש תכנית חינמית
- **Railway** (https://railway.app)
- **Heroku** (https://heroku.com)

צעדים:
1. העלה את תיקיית `/server` לגיטהאב בתור מאגר נפרד
2. התחבר לשירות האירוח באמצעות חשבון הגיטהאב שלך
3. צור שירות חדש והצבע על המאגר של השרת
4. הגדר את משתני הסביבה הנדרשים
5. לאחר שהשרת עולה, קבל את כתובת ה-URL שלו (למשל `https://your-api.render.com`)
6. עדכן את מקורות ה-fetch בקובץ `app.js` להשתמש בכתובת זו במקום `http://localhost:3000`

### 2. שימוש ב-Netlify Functions (Serverless)

אם אתה מעדיף לארח הכל ב-Netlify:

1. צור תיקייה בשם `netlify/functions` בשורש הפרויקט
2. צור פונקציות serverless המבוססות על קוד השרת הקיים
3. עדכן את קובץ `netlify.toml` כדי להגדיר את נתיב הפונקציות
4. עדכן את בקשות ה-fetch בקובץ app.js להשתמש ב-`/.netlify/functions/your-function-name`

דוגמה לפונקציית Netlify:
```javascript
// netlify/functions/analyze-youtube.js
const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { videoUrl, apiKey } = JSON.parse(event.body);
    
    // קוד עיבוד וניתוח של YouTube מתוך server.js
    // ...
    
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## העלאה ל-Netlify

1. העלה את הפרויקט לגיטהאב
2. התחבר ל-Netlify
3. לחץ על "New site from Git"
4. בחר את המאגר שלך
5. הגדרות הבנייה כבר מוגדרות ב-`netlify.toml`
6. לחץ על "Deploy site"

## בעיות נפוצות ופתרונות

### CORS בעיות

אם אתה מארח את השרת בשירות נפרד, ייתכן שתתקל בבעיות CORS.

פתרון:
1. הוסף את ההגדרות הבאות לשרת:
```javascript
app.use(cors({
  origin: 'https://your-netlify-site.netlify.app', // כתובת האתר שלך ב-Netlify
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### בעיות עם משתני סביבה

ב-Netlify, הגדר את משתני הסביבה בלוח הבקרה:
1. עבור אל Site settings > Build & deploy > Environment
2. הוסף משתני סביבה שנדרשים (אם יש)

## קישורים שימושיים

- [תיעוד Netlify](https://docs.netlify.com/)
- [תיעוד Netlify Functions](https://docs.netlify.com/functions/overview/)
- [CORS ב-Netlify](https://docs.netlify.com/routing/headers/)
