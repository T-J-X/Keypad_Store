'use client';

import { useEffect, useState } from 'react';

export default function CopyrightYear() {
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    // Return null initially. This component will render nothing during SSR/Prerendering,
    // and then render the correct year only after hydration on the client.
    if (!year) return null;

    return <>{year}</>;
}
