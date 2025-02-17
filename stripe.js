import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY);

const warsawTimeFrom = new Date("2025-01-01T00:00:00+01:00");
const unixTimestampFrom = Math.floor(warsawTimeFrom.getTime() / 1000);

const warsawTimeTo = new Date("2025-02-01T00:00:00+01:00");
const unixTimestampTo = Math.floor(warsawTimeTo.getTime() / 1000);

let params = {
    created: { gte: unixTimestampFrom, lt: unixTimestampTo },
    limit: 100,
};

let allPayments = [];
let has_more = true;

while (has_more) {
    let janPayments = await stripe.charges.list(params);
    allPayments = allPayments.concat(janPayments.data);
    has_more = janPayments.has_more;
    params.starting_after = janPayments.data[janPayments.data.length - 1].id;
}

// filter only SUCCEEDED payments, sort by created date chronologically, convert created date to real from unix format for each transaction
allPayments = allPayments.filter(p => p.status === 'succeeded')
    .sort((a, b) => a.created - b.created)
    .map(payment => ({
        ...payment,
        created: new Date(payment.created * 1000).toISOString().split('T')[0]
    }));

// unique patient ids for successful payments
let uniquePatientIds = [...new Set(allPayments.map(p => p.metadata.paymentId.split('--')[0]))];

const addWfirmaIdsToMetadata = async function (paymentId, wfirmaInvoiceId, wfirmaContractorId) {
    await stripe.charges.update(
        paymentId,
        {
            metadata: {
                wfirmaInvoiceId: wfirmaInvoiceId,
                wfirmaContractorId: wfirmaContractorId
            }
        }
    );
};

export { allPayments, uniquePatientIds, addWfirmaIdsToMetadata };

