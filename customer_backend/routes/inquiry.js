const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  const CUSTNO = req.body.CUSTNO || req.body.custno || req.body.customerId;

  const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZFM_AISHUINQUIRY>
         <KUNNR>${CUSTNO}</KUNNR>
      </urn:ZFM_AISHUINQUIRY>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/ztest_aishuinquiry?sap-client=100',
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

    console.log('SAP Raw Response:', response.data);

    // Helper to extract multiple tag values from repeating XML nodes
    const extractMultiple = (xml, tag) => {
      const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'g');
      return [...xml.matchAll(regex)].map(match => match[1]);
    };

    const inquiries = [];
    const kunnrArr = extractMultiple(response.data, 'KUNNR');
    const erdatArr = extractMultiple(response.data, 'ERDAT');
    const auartArr = extractMultiple(response.data, 'AUART');
    const angdtArr = extractMultiple(response.data, 'ANGDT');
    const bnddtArr = extractMultiple(response.data, 'BNDDT');
    const vbelnArr = extractMultiple(response.data, 'VBELN');
    const posnrArr = extractMultiple(response.data, 'POSNR');
    const posarArr = extractMultiple(response.data, 'POSAR');
    const arktxArr = extractMultiple(response.data, 'ARKTX');
    const netwrArr = extractMultiple(response.data, 'NETWR');
    const waerkArr = extractMultiple(response.data, 'WAERK');
    const vrkmeArr = extractMultiple(response.data, 'VRKME');
    const kwmengArr = extractMultiple(response.data, 'KWMENG');

    for (let i = 0; i < vbelnArr.length; i++) {
      inquiries.push({
        customerId: kunnrArr[i],
        createdDate: erdatArr[i],
        docType: auartArr[i],
        inquiryDate: angdtArr[i],
        validToDate: bnddtArr[i],
        inquiryNo: vbelnArr[i],
        itemNo: posnrArr[i],
        itemCategory: posarArr[i],
        description: arktxArr[i],
        netValue: netwrArr[i],
        currency: waerkArr[i],
        salesUnit: vrkmeArr[i],
        quantity: kwmengArr[i],
      });
    }

    res.json({
      status: 'S',
      message: 'Inquiry details fetched successfully',
      inquiries: inquiries,
    });

  } catch (error) {
    console.error('SAP Request Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      status: 'E',
      message: 'Error fetching inquiry details.',
    });
  }
});

module.exports = router;
