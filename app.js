
//Requieres
const express = require('express');
const app = express();
const axios = require('axios');
var DomParser = require('dom-parser');
var parser = new DomParser();
const Fs = require('fs')
const Path = require('path')
var Jimp = require("jimp");
const FormData = require('form-data');

let urlPayload = "";
let urlToSendInfo = "";
let statefulhash = "";
let cookie = "";
var loadedImage;

const step4_send = () => {
    axios.defaults.headers.post['Cookie'] = (cookie + '').split(';')[0];
    const formData = new FormData();
    formData.append('code', Fs.createReadStream(Path.resolve(__dirname, 'app.js')));
    formData.append('image', Fs.createReadStream(Path.resolve(__dirname, 'image_sign.jpeg')));
    formData.append('resume', Fs.createReadStream(Path.resolve(__dirname, 'resume.pdf')));
    formData.append('email', "jamonzondc@gmail.com");
    formData.append('name', "Jorge Alberto Monzón del Campo");
    formData.append('aboutme', "Apasionado a la tecnología y siempre queriendo aprender más. Solo espero de ser aceptado poder estar a la altura de lo esperado… y para ello pondré lo mejor de mí con el objetivo de contribuir modestamente, con el desarrollo de vuestra empresa.");

    axios.post(urlToSendInfo, formData, { headers: formData.getHeaders() })
        .then(function (response) {
            console.log(response)
            console.log('Completed');
        })
        .catch(function (error) {
            console.log('error');
        });
}

const step3_getPaylodAndSign = () => {

    axios({ method: 'get', url: urlPayload, responseType: 'stream' })
        .then(async function (response) {
            urlToSendInfo = response.headers['x-post-back-to'];
            console.log('X-Post-Back-To' + " : " + urlToSendInfo);

            const path = Path.resolve(__dirname, 'image.jpeg');
            const writer = Fs.createWriteStream(path);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve)
                writer.on('error', reject)
            })
        })
        .then(function (response) {
            Jimp.read('image.jpeg')
                .then(function (image) {
                    loadedImage = image;
                    return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
                })
                .then(function (font) {
                    loadedImage.print(font, 10, 10, 'Jorge Alberto Monzón del Campo')
                        .write('image_sign.jpeg');
                    console.log('Sign Image');

                    step4_send();
                })
                .catch(function (err) {
                    console.error(err);
                });
        })
        .catch(function (error) {
            console.log(error);
        });
}


const step2_gotToSecondPage = () => {
    axios.defaults.headers.get['Cookie'] = (cookie + '').split(';')[0];
    axios({ method: 'get', url: 'http://www.proveyourworth.net/level3/activate?statefulhash=' + statefulhash })
        .then(function (response) {
            urlPayload = response.headers['x-payload-url']
            console.log('X-Payload-URL' + " : " + urlPayload)

            step3_getPaylodAndSign();
        })
        .catch(function (error) {
            console.log(error);
        });
}

const step1_start = () => {
    axios.get('http://www.proveyourworth.net/level3/start')
        .then(function (response) {
            cookie = response.headers['set-cookie'];
            console.log("set-cookie: " + " : " + cookie);
            var doc = parser.parseFromString(response.data);
            statefulhash = doc.getElementsByTagName('input')[0].getAttribute('value');
            console.log("Statefulhash: " + " : " + statefulhash);

            step2_gotToSecondPage();
        })
        .catch(function (error) {
            console.log(error);
        });

}

step1_start();

//Escuchar peticiones
app.listen(3000, () => {
    console.log(`Example app listening on port 3000`, 'online');
});
