const express = require('express');
const axios = require('axios');
const router = express.Router();
const { parseStringPromise } = require('xml2js');

router.post('/', async (req, res) => {
  // Handle multiple possible parameter names
  const KUNNR = req.body.USER_NAME || req.body.user_name || req.body.customerId || req.body.IV_KUNNR;
  const VBELN = req.body.IV_VBELN || req.body.vbeln;

  if (!KUNNR || !VBELN) {
    return res.status(400).json({
      status: 'E',
      message: 'Both customer number (IV_KUNNR) and billing document (IV_VBELN) are required',
      received: {
        IV_KUNNR: KUNNR,
        IV_VBELN: VBELN
      }
    });
  }

  const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZFM_AIINVOICE>
         <IV_VBELN>${VBELN}</IV_VBELN>
         <IV_KUNNR>${KUNNR}</IV_KUNNR>
      </urn:ZFM_AIINVOICE>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/ztest_aishusinvoice?sap-client=100',
      soapEnvelope,
      {
        headers: {
          'Content-Type': 'text/xml',
          'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:ZFM_AIINVOICE:ZFM_AIINVOICE',
          'Authorization': 'Basic SzkwMTQ2NTpBaXNod2FyeWEqMjM=',
          'Cookie': 'sap-usercontext=sap-client=100'
        },
        responseType: 'text',
        timeout: 30000
      }
    );

    // Parse XML response
    const result = await parseStringPromise(response.data, {
      explicitArray: false,
      tagNameProcessors: [require('xml2js').processors.stripPrefix]
    });

    // Extract PDF data
    const body = result?.Envelope?.Body;
    const rawPDF = body?.ZFM_AIINVOICEResponse?.PDF || 
                   body?.ZFM_AIINVOICEResponse?.X_PDF || 
                   body?.PDF;
    
    // Handle different response formats
    const base64PDF = typeof rawPDF === 'string' ? rawPDF : rawPDF?._;

    if (!base64PDF) {
      console.error('PDF data not found in response:', response.data);
      return res.status(500).json({
        status: 'E',
        message: 'PDF data not found in SAP response',
        sapResponse: response.data
      });
    }

    // Validate base64
    if (!/^[A-Za-z0-9+/=]+$/.test(base64PDF)) {
      console.error('Invalid base64 data');
      return res.status(500).json({
        status: 'E',
        message: 'Invalid PDF data format'
      });
    }

    // Return PDF
    const fileName = `Invoice_${VBELN}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(Buffer.from(base64PDF, 'base64'));

  } catch (error) {
    console.error('SAP Request Error:', error.message);
    if (error.response) {
      console.error('SAP Response:', error.response.data);
      return res.status(500).json({
        status: 'E',
        message: 'SAP returned an error',
        sapError: error.response.data
      });
    }
    res.status(500).json({
      status: 'E',
      message: 'Failed to connect to SAP',
      error: error.message
    });
  }
});

module.exports = router;