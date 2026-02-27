try {
    console.log('Valid:', decodeURIComponent('Test Org'));
    console.log('Valid with %20:', decodeURIComponent('Test%20Org'));
    console.log('Invalid with %:', decodeURIComponent('100% Effort'));
} catch (e) {
    console.error('Error:', e.message);
}
