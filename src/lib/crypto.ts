
export async function hashPassword(password: string): Promise<{ hash: string, salt: string }> {
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    const textEncoder = new TextEncoder();
    const passwordData = textEncoder.encode(password);
    const saltData = textEncoder.encode(saltHex); // Using hex string of salt as per some common implementations, or raw bytes? 
    // User said "hashPasswordWithSalt". Usually: hash(password + salt) or similar.
    // safe bet: WebCrypto import key and sign/derive? 
    // Simple SHA-256(password + salt) is common in older systems or simple ones.
    // Let's assume SHA-256(password + salt_string) for now.

    const combined = new Uint8Array(passwordData.length + saltData.length);
    combined.set(passwordData);
    combined.set(saltData, passwordData.length);

    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return { hash: hashHex, salt: saltHex };
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
    const textEncoder = new TextEncoder();
    const passwordData = textEncoder.encode(password);
    const saltData = textEncoder.encode(storedSalt);

    const combined = new Uint8Array(passwordData.length + saltData.length);
    combined.set(passwordData);
    combined.set(saltData, passwordData.length);

    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === storedHash;
}
