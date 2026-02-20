import { NextResponse } from 'next/server';
import { fetchCheckoutSession } from '../../../lib/vendure.server';

export async function GET(request: Request) {
    try {
        const session = await fetchCheckoutSession();
        return NextResponse.json({ session });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
