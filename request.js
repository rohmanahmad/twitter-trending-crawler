const https = require('follow-redirects').https;

module.exports = function (pathUrl) {
    return new Promise((resolve, reject) => {
        const options = {
            'method': 'GET',
            'hostname': 'getdaytrends.com',
            'path': pathUrl,
            'headers': {
                'X-Requested-With': 'XMLHttpRequest'
            },
            'maxRedirects': 20
        };

        const req = https.request(options, function (res) {
            const chunks = [];
            console.log('Requesting', options.path)
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function (chunk) {
                const body = Buffer.concat(chunks);
                resolve(body.toString());
            });

            res.on("error", function (error) {
                reject(error);
            });
        });

        req.end();
    })
}