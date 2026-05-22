export async function exportToGoogleSlides(accessToken: string, slideOutline: any[]) {
  // 1. Create a new presentation
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Case Strategy Recommendation',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create presentation');
  }

  const presentation = await createRes.json();
  const presentationId = presentation.presentationId;

  // 2. Add slides and their content
  const requests: any[] = [];

  slideOutline.forEach((slide, index) => {
    const slideId = `slide_${index}`;
    // Create slide
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: {
          predefinedLayout: 'TITLE_AND_BODY',
        },
      },
    });

    // We can't immediately add text to the newly created slide's placeholder elements
    // because we need their object IDs, which are auto-generated.
    // However, if we know the layout, TITLE_AND_BODY has placeholders we can target.
    // Actually, targeting placeholders without their IDs in a single BatchUpdate is hard.
    // Let's just create the slide in one request, fetch it, then add text?
    // Or we can add shapes and add text to them.
    // Let's use shapes with known IDs.
    
    const titleId = `title_${index}`;
    const bodyId = `body_${index}`;

    // Wait, the easier way is to create the slides, get the presentation, and update placeholders.
  });

  // Since we need to update text on title and body, let's just do sequential requests.
  // First, create all slides using batchUpdate
  const createLayoutRequests = slideOutline.map((slide, index) => ({
    createSlide: {
      objectId: `slide_${index}`,
      slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' },
    }
  }));

  if (createLayoutRequests.length > 0) {
    await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: createLayoutRequests,
      }),
    });

    // Refetch the presentation to get the object IDs of the placeholders
    const getRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const presentationUpdated = await getRes.json();
    
    // The first slide is the default title slide, so our new slides start at index 1
    const textRequests: any[] = [];
    
    slideOutline.forEach((slide, index) => {
      // The new slide is at index + 1
      const page = presentationUpdated.slides[index + 1];
      if (!page) return;

      const titleElement = page.pageElements.find((el: any) => el.shape?.placeholder?.type === 'TITLE' || el.shape?.placeholder?.type === 'CENTERED_TITLE');
      const bodyElement = page.pageElements.find((el: any) => el.shape?.placeholder?.type === 'BODY' || el.shape?.placeholder?.type === 'SUBTITLE');

      if (titleElement) {
        textRequests.push({
          insertText: {
            objectId: titleElement.objectId,
            text: slide.title,
          }
        });
      }

      if (bodyElement) {
        // Build bullet point text
        let bodyText = slide.purpose + '\n\n';
        slide.bullets.forEach((b: string) => {
          bodyText += `• ${b}\n`;
        });
        
        textRequests.push({
          insertText: {
            objectId: bodyElement.objectId,
            text: bodyText,
          }
        });
      }
    });

    if (textRequests.length > 0) {
      await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: textRequests,
        }),
      });
    }
  }

  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}
