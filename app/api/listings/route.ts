import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Verify user role
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Permission denied. Developer role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      shortDescription,
      fullDescription,
      features,
      whatsIncluded,
      whoItsFor,
      basicPrice,
      extendedPrice,
      hasExtended,
      techStack, 
      category, 
      tags, 
      demoUrl, 
      imageUrl, 
      images,
      downloadUrl
    } = body;

    if (!title || !shortDescription || !fullDescription || !basicPrice || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newListing = {
      title,
      shortDescription,
      fullDescription,
      features: Array.isArray(features) ? features : [],
      whatsIncluded: whatsIncluded || '',
      whoItsFor: whoItsFor || '',
      price: Number(basicPrice), // Default display price is basic
      basicPrice: Number(basicPrice),
      extendedPrice: extendedPrice ? Number(extendedPrice) : null,
      hasExtended: Boolean(hasExtended),
      techStack: techStack || '',
      category,
      tags: Array.isArray(tags) ? tags : [],
      demoUrl: demoUrl || '',
      imageUrl: imageUrl || (Array.isArray(images) && images.length > 0 ? images[0] : 'https://picsum.photos/seed/listing/800/600'),
      images: Array.isArray(images) ? images : [],
      downloadUrl: downloadUrl || '',
      authorId: uid,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      // Legacy support
      description: shortDescription,
    };

    const docRef = await adminDb.collection('listings').add(newListing);

    return NextResponse.json({ id: docRef.id, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('API Listing Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
