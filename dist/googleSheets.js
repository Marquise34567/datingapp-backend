"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendPurchaseRow = appendPurchaseRow;
const googleapis_1 = require("googleapis");
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || '';
const sheetId = process.env.GOOGLE_SHEET_ID;
const sheetTab = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
function getJwtClient() {
    if (!serviceAccountEmail || !privateKeyRaw)
        return null;
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    const jwt = new googleapis_1.google.auth.JWT(serviceAccountEmail, undefined, privateKey, ['https://www.googleapis.com/auth/spreadsheets']);
    return jwt;
}
async function appendPurchaseRow(row) {
    if (!sheetId) {
        console.warn('googleSheets: no sheet id configured');
        return false;
    }
    const jwt = getJwtClient();
    if (!jwt)
        return false;
    try {
        await jwt.authorize();
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth: jwt });
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: `${sheetTab}`,
            valueInputOption: 'RAW',
            requestBody: { values: [row] },
        });
        return true;
    }
    catch (e) {
        console.warn('googleSheets append failed', e);
        return false;
    }
}
