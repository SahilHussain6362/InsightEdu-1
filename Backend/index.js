require('dotenv').config();
const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const bodyParser = require('body-parser');
const { JWT } = require('google-auth-library');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.options('*', cors());

const serviceAccountAuth = new JWT({
    email: 'ili-app@ili-app.iam.gserviceaccount.com',
    key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuqdd3q0ZILGqV\nLQwLgOyd9sn8/ceVuhT7KrFBT9/at+is9sOzfG+1BUI9XrXh1yGvygwY+XtG6U2O\nyeLLnwK1MXM73JaIi62yNcHVObmAUeS6nxwY4ZaNkEtokbtl4RuEZoxF5MWFg9Rc\nX2loTShu9saSiixE5bTXyrGR2GWbwSH9uWUB4X7xUh1yamGIec0kqWDkBUExfJhk\nXyvnwOEdtVCmMo15ynjqE+CxNxlzjMkEVoJasvvgDSQCwTwK74lu+fFd1oU51DTL\nvLZvj3n1IMfEVpjO2LtvrJ9i+MD9jUQZxQbSgqGFjx3JSQVkaZ+yCE0XLbekDrol\nXAvTM6ehAgMBAAECggEAIq2CY9ZLzy8QXztRIaSQdgFmU5ZATtQh78cnZ7f30ilC\n5zpcGxHo7NgVMXGRK3xmygvTsI6x4N+XwDKJlpNkunxNrHQsqAIRc6k0KYU7NQSt\nZLcL4U3CsisUqbeLbRwPNk+U6JiV9d75ZfikiSqOjU9uF/CafvhbWh+6dyIvdEeE\nvFaQHcyAwG5q1FNCNTbePvGGfNzCkq2+p3o77Mt/mNYjFQkxPQz3rnoAH0Vsg3RN\ns9PfhtjsjsgnWBaZ7G7Hr4zQbG8RsgDbW+22LJAkR4jPmTY2sZu2NsZePgv7YIw8\nr4v/SGn4rA9WT6/Zhc22Ix2Ijv7h1u2VYhhwZbo2lQKBgQDvm36iThr7wZULVRum\nVilxf4EG8bnh/3PLvq8ISPHX/VdwkU/O+qUNKmEiH3DzrOvLUIisM64/IZXM9v+K\n9ablv6DEOVCC/pRvbSeAR0rHrR4OfaUiXT1E6JneaKDWxCL4EaIJUIyrW0rUO+F1\nuCIGCd2hlziSD/5qw0c36zCZJQKBgQC6nOmrAIiDGWeW870Lr4BcFOnWP1XBoNhK\nTJMRKP/Kj01ERo75dNjxAqlr8iJOqXXHG56/mJ2BxT6rhMaTYPzAnqPHGc0OSRvZ\nFmpRrnUHrNN3w7Lx7fUBWK8coiNbHvw0HyR222Gku0wdijvYYI2BRhNzV982gxTI\n60K0N5phzQKBgQCJ8mjmwrbwSJQpkRc5HZQAnxrGx7Zv8aVWIPMefviVlGqaCV78\nV/tcaBDCF33tHJooVLZLBfoEqK5Y8b9P3nv2++tv7Vt3/1+wAxTh2qmn6fhK+XVw\nImQa3xtvG6e13fgP//7dA/3ozcd4Bv2Xy6ny9g0ecjSEiya7iq/e9s3k7QKBgBky\ncLafNs+E0aDnPkJiqxFD3aMJIDopzqqRllX91DP0j3lFka6LIXPBaUDjC9DVPsro\nptG1+KZ6DJE6N1nVAau8f961VCO2qWTxit+Gj9S+eDs2mGXkPG23HMXf+qgmEeWz\nwsetrYyBobBnZtc7ij/HR38OgVwp7NeINJSC4XyNAoGAT5svg6LtF1J6hT+e5qUv\nPQ8dLxXMB1PNKFM7eIP8YCA157gpWPp+0q2ihLay7JJurBSxqc5VeXHSz7i9p6Oy\nvTrfdhBJQ1/J4kNAkP7IN4lRzoJ3nVm9ltHWB/0fU4gVp05m/lk8f3Yk/nGDryDY\n7+LQtC2bqGAMeYI4tMahwdA=\n-----END PRIVATE KEY-----\n',
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const doc = new GoogleSpreadsheet('1j1I1ozIgmnSRMKc3m-IkLnAfDGfdjzIxyw29IzRlC10', serviceAccountAuth);

app.post('/api/addToSheet', async (req, res) => {
  try {
    const rawData = req.body;
    const lectureInfo = rawData.lectureInfo;

    // Sum the audio times and text times
    const totalAudioTime = ['pageAudio1', 'pageAudio2', 'pageAudio3', 'pageAudio4', 'pageAudio5'].reduce((sum, key) => sum + (parseFloat(lectureInfo[key]) || 0), 0);
    const totalTextTime = ['pageText1', 'pageText2', 'pageText3', 'pageText4', 'pageText5'].reduce((sum, key) => sum + (parseFloat(lectureInfo[key]) || 0), 0);

    await doc.loadInfo(); 
    const sheet = doc.sheetsByIndex[0];
    const data = [{
        'Student Name' : rawData['studentInfo']['name'],
        'Pre Test Score' : rawData['preTestInfo']['score'],
        'Pre Test Time': rawData['preTestInfo']['timeTaken'], 
        'Lecture Audio Time': totalAudioTime,
        'Lecture Text Time': totalTextTime,
        'Post Test Score': rawData['postTestInfo']['score'],
        'Post Test Time': rawData['postTestInfo']['timeTaken'],
        'Before Pre Test Heart Rate' : rawData['beforePreTestHeart'],
        'After Pre Test Heart Rate' : rawData['afterPreTestHeart'],
        'Before Lecture Heart Rate' : rawData['beforeLectureHeart'],
        'After Lecture Heart Rate' : rawData['afterLectureHeart'],
        'Before Post Test Heart Rate' : rawData['beforePostTestHeart'],
        'After Post Test Heart Rate' : rawData['afterPostTestHeart'],
        
        'Audio Time 1': lectureInfo?.pageAudio1 || '',
        'Audio Time 2': lectureInfo?.pageAudio2 || '',
        'Audio Time 3': lectureInfo?.pageAudio3 || '',
        'Audio Time 4': lectureInfo?.pageAudio4 || '',
        'Audio Time 5': lectureInfo?.pageAudio5 || '',
        'Text Time 1': lectureInfo?.pageText1 || '',
        'Text Time 2': lectureInfo?.pageText2 || '',
        'Text Time 3': lectureInfo?.pageText3 || '',
        'Text Time 4': lectureInfo?.pageText4 || '',
        'Text Time 5': lectureInfo?.pageText5 || '',
        'Complete Student Information': '',
        'Question wise Pre Test Data': rawData['preTestInfo']['questionData'],
        'Question wise Post Test Data': rawData['postTestInfo']['questionData'],
        'Lecture Audio Complete Data': rawData['audioRawData'],
        'Lecture Text Complete Data': ''
    }];
    const addRow = await sheet.addRows(data);
    res.status(200).json({ message: "Data Saved" });
  } catch (error) {
    console.error('Error adding data to Google Sheet', error);
    res.status(500).json({ message: 'Failed to add data to Google Sheet' });
  }
});

app.get('/api/fetchQuestions', async (req, res) => {
  try {
    await doc.loadInfo(); 
    const sheet = doc.sheetsByIndex[1];
    const rows = await sheet.getRows();
    const jsonSheet = rows.map(row => row._rawData);
    res.status(200).json({ message: "Data Saved", data: jsonSheet });
  } catch (error) {
    console.error('Error Fetching Data', error);
    res.status(500).json({ message: 'Failed' });
  }
});

app.post('/api/deleteQuestion', async (req, res) => {
  try {
    const question = req.body['Question'];
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[1];
    const rows = await sheet.getRows();
    const rowToDelete = rows.find(row => row._rawData[0] === question);
    if (rowToDelete) {
      await rowToDelete.delete();
      res.status(200).json({ message: "Question Deleted" });
    } else {
      res.status(404).json({ message: "Question not found" });
    }
  } catch (error) {
    console.error('Error Deleting Question', error);
    res.status(500).json({ message: 'Failed' });
  }
});

app.post('/api/addQuestion', async (req, res) => {
  try {
    const newQuestion = req.body;
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[1];
    const data = [{
        'Question': newQuestion['Question'],
        'Options': newQuestion['Options'],
        'Answer': newQuestion['Correct'],
    }];
    const addRow = await sheet.addRows(data);
    res.status(200).json({ message: "Question Added", data: data });
  } catch (error) {
    console.error('Error Adding Question', error);
    res.status(500).json({ message: 'Failed' });
  }
});

app.post('/api/addParagraph', async (req, res) => {
  try {
    const newParagraph = req.body;
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[2]; // Assumes Paragraphs sheet is the third sheet (index 2)
    const data = [{
        'Paragraph': newParagraph['Paragraph']
    }];
    const addRow = await sheet.addRows(data);
    res.status(200).json({ message: "Paragraph Added", data: data });
  } catch (error) {
    console.error('Error Adding Paragraph', error);
    res.status(500).json({ message: 'Failed' });
  }
});

app.get('/api/fetchParagraphs', async (req, res) => {
  try {
    await doc.loadInfo(); 
    const sheet = doc.sheetsByIndex[2]; // Assumes Paragraphs sheet is the third sheet (index 2)
    const rows = await sheet.getRows();
    const jsonSheet = rows.map(row => row._rawData);
    res.status(200).json({ message: "Data Retrieved", data: jsonSheet });
  } catch (error) {
    console.error('Error Fetching Data', error);
    res.status(500).json({ message: 'Failed' });
  }
});

app.get('/api/test', async (req, res) => {
  try {
    res.status(200).json({ message: 'Connection Works' });
  } catch (error) {
    console.error('Error connecting', error);
    res.status(500).json({ message: 'Failed to Connect' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
