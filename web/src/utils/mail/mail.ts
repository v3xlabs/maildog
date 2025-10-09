interface MailPart {
    headers: Record<string, string>;
    content: string;
    contentType?: string;
}

interface ParsedMail {
    headers: Record<string, string>;
    parts: MailPart[];
}

const parseHeaders = (headerText: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    const lines = headerText.split(/\r?\n/);

    let currentHeader = '';
    let currentValue = '';

    for (const line of lines) {
        if (/^\s/.test(line) && currentHeader) {
            // Continuation line
            currentValue += ' ' + line.trim();
        } else {
            // Save previous header
            if (currentHeader) {
                headers[currentHeader.toLowerCase()] = currentValue.trim();
            }

            // Start new header
            const colonIndex = line.indexOf(':');

            if (colonIndex > 0) {
                currentHeader = line.slice(0, colonIndex).trim();
                currentValue = line.slice(colonIndex + 1).trim();
            } else {
                currentHeader = '';
                currentValue = '';
            }
        }
    }

    if (currentHeader) {
        headers[currentHeader.toLowerCase()] = currentValue.trim();
    }

    return headers;
};

const parseMultipart = (body: string, boundary: string): MailPart[] => {
    const parts: MailPart[] = [];
    const delimiter = `--${boundary}`;
    const sections = body.split(delimiter);

    for (let index = 1; index < sections.length; index++) {
        const section = sections[index];

        if (!section || section.trim().startsWith('--')) continue;

        // Find empty line separating headers from content
        const emptyLineIndex = section.search(/\r?\n\r?\n/);

        if (emptyLineIndex === -1) continue;

        const headerText = section.slice(0, emptyLineIndex);
        const content = section.slice(emptyLineIndex + 2);

        const headers = parseHeaders(headerText);
        const contentType = headers['content-type'] || '';

        console.log('Content type:', contentType);

        // Handle nested multipart
        if (contentType.includes('multipart/')) {
            const nestedBoundaryMatch =
                contentType.match(/boundary="([^"]+)"/i);

            if (nestedBoundaryMatch && nestedBoundaryMatch[1]) {
                const nestedParts = parseMultipart(
                    content,
                    nestedBoundaryMatch[1]
                );

                parts.push(...nestedParts);
                continue;
            }
        }

        parts.push({
            headers,
            content: content.trim(),
            contentType,
        });
    }

    return parts;
};

const extractMail = (rawMail: string): ParsedMail => {
    let emptyLineIndex = rawMail.search(/\r?\n--/);

    if (emptyLineIndex === -1) {
        emptyLineIndex = rawMail.search(/\r?\n\r?\n/);

        if (emptyLineIndex === -1) {
            return { headers: {}, parts: [] };
        }
    }

    const headerText = rawMail.slice(0, emptyLineIndex);
    const body = rawMail.slice(emptyLineIndex + 2);

    // Debug: log the first few lines of headerText
    console.log('Header text (first 500 chars):', headerText.slice(0, 500));
    console.log('Empty line index:', emptyLineIndex);
    console.log('Header text length:', headerText.length);

    const headers = parseHeaders(headerText);

    console.log('Parsed headers count:', Object.keys(headers).length);
    console.log('Headers entries:', Object.entries(headers).slice(0, 5));

    const contentType = headers['content-type'] || '';

    console.log('Content type:', contentType);

    let parts: MailPart[] = [];

    if (contentType.includes('boundary=')) {
        const boundaryMatch = contentType.match(/boundary="?([^"]+?)[\n";]+/i);

        if (boundaryMatch && boundaryMatch[1]) {
            console.log('Boundary:', boundaryMatch[1]);
            parts = parseMultipart(body, boundaryMatch[1]);
        }
    } else {
        // Single part email
        parts = [
            {
                headers,
                content: body,
                contentType,
            },
        ];
    }

    return { headers, parts };
};

export { type MailPart, type ParsedMail, extractMail };

function decodeRfc2047(input: string): string {
    let unfolded = input.replace(/\r?\n[\t ]+/g, ' ');
    
    unfolded = unfolded.replace(/(\?=)\s+(=\?)/g, '$1$2');
    
    return unfolded.replace(
        /=\?([^?]+)\?([BQbq])\?([^?]*)\?=/g,
        (match, charset, enc, text) => {
            if (enc.toUpperCase() === 'Q') {
                // RFC 2047 Q-encoding: "_" => " ", "=XX" hex => byte
                return text
                    .replace(/_/g, ' ')
                    .replace(/=([\dA-Fa-f]{2})/g, (_, h) =>
                        String.fromCharCode(Number.parseInt(h, 16))
                    );
            } else if (enc.toUpperCase() === 'B') {
                // Base64 decoding
                try {
                    return Buffer.from(text, 'base64').toString('utf8');
                } catch {
                    return text;
                }
            }
            return text;
        }
    );
}

function parseListUnsubscribe(rawHeader: string) {
    const decoded = decodeRfc2047(rawHeader);

    return decoded
        .split(',')
        .map((p) => p.trim().replace(/^<|>$/g, '')) // strip angle brackets
        .filter(Boolean)
        .map((s) => {
            try {
                const u = new URL(s);

                if (u.protocol === 'mailto:') {
                    const address = decodeURIComponent(u.pathname);
                    const subject = u.searchParams.get('subject') ?? undefined;
                    const parameters: [string, string][] = [];

                    for (const [k, v] of u.searchParams.entries()) {
                        if (k !== 'subject') parameters.push([k, v]);
                    }

                    return {
                        kind: 'mailto',
                        address,
                        subject,
                        params: parameters,
                        raw: s,
                    };
                }

                return { kind: 'url', url: s, raw: s };
            } catch (error) {
                console.log('Failed to parse URL:', s, error);
                return null;
            }
        })
        .filter(Boolean);
}

export { parseListUnsubscribe };
