const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  const CUSTNO = req.body.CUSTNO || req.body.custno;
  const PASSWORD=req.body.PASSWORD || req.body.password;

  const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                         xmlns:urn="urn:sap-com:document:sap:rfc:functions">
    <soapenv:Header/>
    <soapenv:Body>
      <urn:ZUST_AISHULOGIN>
        <KUNNR>${CUSTNO}</KUNNR>
        <PASSWORD>${PASSWORD}</PASSWORD>
      </urn:ZUST_AISHULOGIN>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/ztest_aishuulogin?sap-client=100',
      soapEnvelope,
      {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Authorization': 'Basic SzkwMTQ2NTpBaXNod2FyeWEqMjM=',
          'Cookie': 'sap-usercontext=sap-client=100',
        },
        responseType: 'text',
      }
    );

    console.log('HTTP Status Code:', response.status);
    console.log('SAP Raw Response:', response.data);

    // Extract EV_SUCCESS and EV_MESSAGE from the SOAP response
    const evStatusMatch = response.data.match(/<EV_SUCCESS>(.*?)<\/EV_SUCCESS>/);
    const evMessageMatch = response.data.match(/<EV_MESSAGE>(.*?)<\/EV_MESSAGE>/);

    const ev_status = evStatusMatch ? evStatusMatch[1] : 'E';
    const ev_message = evMessageMatch ? evMessageMatch[1] : 'Message not returned';

    // Respond with both status and message
    res.json({ status: ev_status, message: ev_message });

  } catch (error) {
    console.error('SAP Request Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ status: 'failed', message: 'Error contacting SAP service.' });
  }
});

module.exports = router;