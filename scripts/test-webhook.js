
async function testWebhook() {
    try {
        const response = await fetch('http://localhost:3000/api/webhooks/lojou', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'test',
                amount: 100
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Body:', data);

        if (response.status === 200 && data.success === true) {
            console.log('SUCCESS: Endpoint is public and accessible.');
        } else if (response.status === 307 || response.status === 308) {
            console.log('FAILURE: Endpoint redirected (likely auth protection).');
        } else {
            console.log('RESULT: Endpoint accessible but returned other status (expected for invalid payload).');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testWebhook();
