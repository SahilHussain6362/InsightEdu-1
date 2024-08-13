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
    email: "ili-app@ili-app-432406.iam.gserviceaccount.com",
    key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDcXgLZAV4bjfwr\nGA4YvhJWvMlDS1VFaMRdE4uwkbEkM5nCpF29HzXMXx07yCOkr2yBhRXJKQYCj3fJ\nZobZ637I6jBghHrdiPq6ZCwthRwufahZY5GRMRFRUrOC0bSywvvVoxVjIVfXTV0r\npuWA5/tVudtDqEyjviA0KHQyJNs7GvXet3bjeOqZWW/tLXlosl4EpKwqHCihC47T\nfnxp1X5BzEDugjMdur+H6P4OTycJiBuslZUHjw3wUVdzwtFDMSYI4LZMgtSWVHzH\nxPPxYVphb1A28OkrWHbDOT0Z1EphEJ+AyLUehvZaphwb4k7ke7g9VA/xntbDEpC/\nrxGSTG+hAgMBAAECggEAA08nGeUKUBdQ/0De31JYk9rFM/OmGpytspvrR/H1vmGT\nyfqhZlUyzKuflJww16JQJ3hdGonGHq45KIbxXsVJgJD7VbIcZtMnUe3uRIDtKpAp\nAcfVi2zFW43TU8ZvgS3qTbijk6F2mfokfGLgeE/WtDobBJHuFExnDxl0OArAWKVL\n6Sgfu6aXQ0nCLhLFzwZHuVlwZz8zbLvyrZ89SYVAE1fg/EmOobHC9PPaggA9SckD\nev/Z6RiOoY+S5TpaTaqkvOyssvyTArXkn8VCHbBbYds+lWLJPTraMHkTSuneqV6u\nfTH57vrPAmyvXaYD4VxGXkMVNDbYv/kQ6Oj/NkM69QKBgQD2iQPBR/9JjKFik3BR\nmA+p/BaCDayYWFLSnyo8RZH2CNtE+ocarBPCU7IKlSXmxCnMAwuZRAjcq34Fa8sR\neCf3oVymCEQ06VwRAflmdenyTxlGK/44TRr5Kqqxi4q+DsfarkxYMLHXl2LQsTu3\nFdDhi3o2t8fmQTjWUYlLIJ8OxQKBgQDk09BGCL8eDqa8e6iBpi+3XknXrohjACQz\npc2bx8fEQq6KkwJIb61ZSKhZVhWTWQvVypD9vc9U/fd51FjK/IMWMfqzD8WQMHYr\nHZQFGb7KsZo4VjWgg+bWscjwTedVCPUVwKMqdq9rDFU04ZjP3sEs/nGjnYgUXC44\nffYWwSjrLQKBgCATnbB1PKsGKC1aP5/uKAOW8BrFyrIbs9MBsI4dAyu+5UCpVBDN\nWNjM6Pplg4Pt+/42Wzj62ChWC9SKvOYt+w1GKnbT1oQH5Nm1pwyExQao8gHmUXJj\n3eGTgpgNLuUhqTEzwm0rEMibQtkiZkGhDgd6jVE3QkQcMlf4TeO/f9J9AoGAden8\nGgqpyShNnTSviVeEoR3yOTUTzMgm34Jh6BNTinu+C2RjucXqcuaw8ZAdgBdTtPA0\nNLzZmPdhziKxOrBSMF7CzAClkn6WdfNA8jvpB/Pq/3rVGYi+rAVjAQlz2mrKOFJT\nAi+0hxoM0joqD3u+2ZuoHWKw26UAoFWwONuCZWUCgYBWo0CVMZ4h+WR0QRx/ypUz\nSRAuaa4KJJwmY01ML3bpKik30do0vYEfO9OGsRZ0vlJytPs30PMJI5GjM2AryuPx\nm5pmXvc2v8iuXQcCQ6xSeQ6qx5CZLgsb5POcPOMl39Z1oeitcv4hCKv9EBMyX4uS\nxY1t12wwblJ8kguXxMnvTw==\n-----END PRIVATE KEY-----\n",
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const doc = new GoogleSpreadsheet('1otnCxVm1SUAkGvdThkxi3qxjnKOHnfRCYrxAWv5jD40', serviceAccountAuth);

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
