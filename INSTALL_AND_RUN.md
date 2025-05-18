# VideoInsights - הוראות התקנה והפעלה

## רכיבי המערכת

VideoInsights מורכבת משני רכיבים עיקריים:
1. **צד לקוח (frontend)**: קוד HTML, CSS ו-JavaScript שרץ בדפדפן
2. **צד שרת (backend)**: שרת Node.js המטפל בעיבוד וידאו

## דרישות מערכת

1. **Node.js** (גרסה 14 ומעלה)
2. **npm** (מנהל החבילות של Node.js)
3. **ffmpeg** (לעיבוד וידאו בשרת)

## התקנת ffmpeg

### Windows
1. הורד את ffmpeg מהאתר הרשמי: [ffmpeg.org](https://ffmpeg.org/download.html)
2. חלץ את הקבצים לתיקייה (למשל `C:\ffmpeg`)
3. הוסף את התיקייה `C:\ffmpeg\bin` למשתנה הסביבה PATH

### macOS (באמצעות Homebrew)
```
brew install ffmpeg
```

### Linux
```
sudo apt update
sudo apt install ffmpeg
```

## התקנת השרת

1. פתח את תיקיית `server` בטרמינל:
```
cd server
```

2. התקן את כל התלויות:
```
npm install
```

## הפעלת השרת

1. בתוך תיקיית `server`:
```
npm start
```

2. השרת יפעל בכתובת http://localhost:3000

## הפעלת האפליקציה

1. פתח את קובץ `index.html` בדפדפן
2. הזן את מפתח ה-API שלך (Google AI Studio)
3. השתמש באחת האפשרויות:
   - הזן כתובת URL של YouTube
   - העלה קובץ וידאו מהמחשב שלך
4. לחץ על כפתור "Analyze"

## פתרון בעיות

1. **"Could not process video. Using sample results instead"**
   - ודא שהשרת פועל בכתובת http://localhost:3000
   - ודא ש-ffmpeg מותקן כראוי במערכת
   - בדוק שמפתח ה-API שלך תקין

2. **"Server error"**
   - בדוק את הלוגים של השרת בטרמינל
   - ודא שיש לך גישה לאינטרנט

3. **בעיות התקנת ffmpeg**
   - בדוק שהוספת את ffmpeg לנתיב המערכת
   - נסה להריץ `ffmpeg -version` בטרמינל לוודא שההתקנה תקינה

## מה הצד הבא עושה?

השרת מטפל במטלות שדפדפן לא יכול לבצע בעצמו:
1. עיבוד קבצי וידאו באמצעות ffmpeg
2. חילוץ פריימים מהוידאו לניתוח
3. תקשורת עם API של Google AI Studio
4. עיבוד תוצאות וארגון המידע למבנה שימושי

זה מאפשר ניתוח מעמיק יותר של הוידאו מאשר האפשרי בצד לקוח בלבד.
