import convert from 'xml-js';

function nativeType(value) {
    var nValue = Number(value);
    if (!isNaN(nValue)) {
      return nValue;
    }
    var bValue = value.toLowerCase();
    if (bValue === 'true') {
      return true;
    } else if (bValue === 'false') {
      return false;
    }
    return value;
};

let removeJsonTextAttribute = function(value, parentElement) {
    try {
      var keyNo = Object.keys(parentElement._parent).length;
      var keyName = Object.keys(parentElement._parent)[keyNo - 1];
      parentElement._parent[keyName] = nativeType(value);
    } catch (e) {}
};

let options = {
    compact: true,
    trim: true,
    ignoreDeclaration: true,
    ignoreInstruction: true,
    ignoreAttributes: true,
    ignoreComment: true,
    ignoreCdata: true,
    ignoreDoctype: true,
    textFn: removeJsonTextAttribute
};

let headers = {
    appKey: process.env.SPOLKA_APP_KEY,
    accessKey: process.env.SPOLKA_ACCESS_KEY,
    secretKey: process.env.SPOLKA_SECRET_KEY,
    'content-type': 'application/xml',
};

// returns contractor's id
async function addContractor(firstName, lastName, street, houseNumber, zip, city, email, unitId) {

    function formatZipCode(zip) {
        const digits = zip.replace(/\D/g, '').slice(0, 5);
        if (digits.length < 5) throw new Error('Invalid ZIP code');
        return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
      
    let contractor = `<?xml version="1.0" encoding="UTF-8"?>
                            <api>
                                <contractors>
                                    <contractor>
                                        <tax_id_type>none</tax_id_type>
                                        <name>${firstName} ${lastName}</name>
                                        <street>${street} ${houseNumber}${unitId ? '/' + unitId : ''}</street>
                                        <zip>${formatZipCode(zip)}</zip>
                                        <city>${city}</city>
                                        <country>PL</country>
                                        <email>${email}</email>
                                    </contractor>
                                </contractors>
                            </api>`;

    const url = `https://api2.wfirma.pl/contractors/add?inputFormat=xml&outputFormat=xml&company_id=${process.env.COMPANY_ID}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: new TextEncoder().encode(contractor),
        });
        const data = await response.text();
        const result = convert.xml2js(data, options);
        const id = result.api.contractors.contractor.id;
        return id;
    } catch(e) {
        console.log('Error: ', e);
    }
};

// returns contractor's id                            
async function findContractor(email) {
    const contractorToFind = `<?xml version="1.0" encoding="UTF-8"?>
                            <api>
                                <contractors>
                                    <parameters>
                                        <conditions>
                                            <condition>
                                                <operator>eq</operator>
                                                <field>email</field>
                                                <value>${email}</value>
                                            </condition>
                                        </conditions>
                                    </parameters>
                                </contractors>
                            </api>`;

    const url = `https://api2.wfirma.pl/contractors/find?outputFormat=xml&company_id=${process.env.COMPANY_ID}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: new TextEncoder().encode(contractorToFind),
        });
        const data = await response.text();
        const result = convert.xml2js(data, options);
        return result?.api?.contractors?.contractor?.id || false;
    } catch(e) {
        console.log('Error: ', e);
    }
};

// returns id of newly created invoice
async function addInvoice(created, contractorId) {
    const raw1 = `<?xml version="1.0" encoding="UTF-8"?>
                <api>
                    <invoices>
                        <invoice>
                            <paymentmethod>transfer</paymentmethod>
                            <paymentdate>${created}</paymentdate>
                            <disposaldate>${created}</disposaldate>
                            <date>${created}</date>
                            <alreadypaid_initial>10.00</alreadypaid_initial>
                            <type>normal</type>
                            <currency>PLN</currency>
                            <description>Usługa zwolniona z VAT na podstawie art. 43 ust. 1 pkt 18/19 ustawy o VAT.</description>
                            <schema>normal</schema>
                            <price_type>netto</price_type>
                            <contractor>
                                <id>${contractorId}</id>
                            </contractor>
                            <invoicecontents>
                                <invoicecontent>
                                    <good>
                                        <id>38293496</id>
                                    </good>
                                </invoicecontent>
                            </invoicecontents>
                        </invoice>
                    </invoices>
                </api>`;

    const url = `https://api2.wfirma.pl/invoices/add?outputFormat=xml&inputFormat=xml&company_id=${process.env.COMPANY_ID}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: new TextEncoder().encode(raw1),
        });
        const data = await response.text();
        const result = convert.xml2js(data, options);
        const id = result.api.invoices.invoice.id;
        return id;
    } catch(e) {
        console.log('Error: ', e);
    }
}

export { addContractor, findContractor, addInvoice };