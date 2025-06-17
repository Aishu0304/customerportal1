const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  const KUNNR = req.body.KUNNR || req.query.KUNNR;

  if (!KUNNR) {
    return res.status(400).json({ 
      status: 'E', 
      message: 'Missing KUNNR parameter.' 
    });
  }

  const soapEnvelope = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:urn="urn:sap-com:document:sap:rfc:functions">
    <soapenv:Header/>
    <soapenv:Body>
      <urn:ZFM_AISHPROFILE>
        <KUNNR>${KUNNR}</KUNNR>
      </urn:ZFM_AISHPROFILE>
    </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/ztest_aishuprofile?sap-client=100',
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

    // Helper function to extract XML values
    const extractValue = (xml, tag) => {
      const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's');
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };

    const responseData = response.data;
    
    // Map the exact fields from your FM
    const customerProfile = {
      MANDT: extractValue(responseData, 'MANDT'),
      KUNNR: extractValue(responseData, 'KUNNR'),
      NAME1: extractValue(responseData, 'NAME1'),
      ORT01: extractValue(responseData, 'ORT01'),
      LAND1: extractValue(responseData, 'LAND1'),
      REGIO: extractValue(responseData, 'REGIO'),
      PSTLZ: extractValue(responseData, 'PSTLZ'),
      STRAS: extractValue(responseData, 'STRAS'),
      TELF1: extractValue(responseData, 'TELF1'),
      VKORG: extractValue(responseData, 'VKORG'),
      VTWEG: extractValue(responseData, 'VTWEG'),
      SPART: extractValue(responseData, 'SPART'),
      KDGRP: extractValue(responseData, 'KDGRP'),
      BZIRK: extractValue(responseData, 'BZIRK'),
      PARVW: extractValue(responseData, 'PARVW'),
      PARZA: extractValue(responseData, 'PARZA')
    };

    if (!customerProfile.KUNNR) {
      return res.status(404).json({ 
        status: 'E', 
        message: 'Customer not found.' 
      });
    }

    res.json({ 
      status: 'S', 
      message: 'Profile fetched successfully', 
      profile: customerProfile 
    });

  } catch (error) {
    console.error('SAP Request Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      status: 'E', 
      message: 'Error fetching customer profile',
      details: error.message 
    });
  }
});

module.exports = router;