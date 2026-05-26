import { test, expect } from '@playwright/test';

test.describe('CaseEdge Intake-to-Q&A Workflow E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept and mock all /api/gemini/generate POST requests to avoid API calls and billing
    await page.route('**/api/gemini/generate', async (route) => {
      const request = route.request();
      if (request.method() !== 'POST') {
        return route.continue();
      }

      const { action } = request.postDataJSON();

      if (action === 'analyzeCase') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              industry: 'Airline',
              coreProblem: 'Airline profitability declined by 15% despite stable revenue.',
              keyStakeholders: ['CEO', 'Board of Directors', 'Passengers'],
              keyConstraints: ['Stable revenue', 'Passenger volumes'],
              clarifyingQuestions: ['What are the driver cost increases?', 'Are fuel prices rising?'],
              caseType: 'Profitability'
            }
          })
        });
      } else if (action === 'buildIssueTree') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              id: 'root',
              label: 'Decline in Airline Profitability',
              children: [
                {
                  id: 'revenue',
                  label: 'Revenue Drivers',
                  children: [
                    { id: 'passenger-rev', label: 'Passenger Ticket Revenue' },
                    { id: 'ancillary-rev', label: 'Ancillary Services Revenue' }
                  ]
                },
                {
                  id: 'costs',
                  label: 'Cost Drivers',
                  children: [
                    { id: 'fuel-costs', label: 'Fuel Costs' },
                    { id: 'labor-costs', label: 'Labor/Staffing Costs' }
                  ]
                }
              ]
            }
          })
        });
      } else if (action === 'recommendFrameworks') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: [
              {
                name: 'Profitability Framework',
                whyItFits: 'Directly maps revenues and costs to identify profit drivers.',
                diagnosticQuestions: ['How have fixed costs changed?', 'What is the variable cost per passenger?']
              },
              {
                name: 'Value Chain Analysis',
                whyItFits: 'Helps identify inefficiencies in operations and fuel purchasing.',
                diagnosticQuestions: ['Are fuel hedging policies in place?', 'Is staff utilization optimal?']
              }
            ]
          })
        });
      } else if (action === 'draftRecommendation') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              situation: 'Our client is experiencing a 15% profit decline.',
              complication: 'Fuel and labor costs have risen significantly while passenger revenue is flat.',
              resolution: 'Implement fuel hedging, optimize crew scheduling, and introduce premium ancillary options.'
            }
          })
        });
      } else if (action === 'buildQuantitativeEstimate') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              tam: { value: '$12B', assumption: 'Total domestic US airline market size' },
              revenueImpact: { value: '+$80M', assumption: 'Ancillary fee optimization and premium pricing' },
              implementationCost: { value: '$15M', assumption: 'Scheduling software and training costs' },
              paybackPeriod: { value: '9 months', assumption: 'Based on quick win cost reductions' },
              keyMetric: { value: '+4.5% margin', assumption: 'Expected operating profit margin improvement' }
            }
          })
        });
      } else if (action === 'generateSlideOutline') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: [
              { title: 'Executive Summary', purpose: 'Provide a 1-slide overview of findings', bullets: ['15% margin decline addressed', 'Fuel/labor cost optimized', 'ROI in 9 months'] },
              { title: 'Situation & Complication', purpose: 'Explain the industry context and problem', bullets: ['Industry capacity stable', 'Labor costs rose 8%', 'Fuel prices volatile'] }
            ]
          })
        });
      } else if (action === 'simulateQA') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: [
              { question: 'What if labor unions block the scheduling changes?', modelAnswer: 'We will engage union representatives early to show how optimized schedules improve quality of life.' },
              { question: 'Is a 9-month payback realistic?', modelAnswer: 'Yes, because fuel hedging benefits will be realized in the first quarter, while software implementation takes 6 months.' }
            ]
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ result: null })
        });
      }
    });
  });

  test('successfully navigates from landing through intake to Q&A', async ({ page }) => {
    // 1. Go to homepage
    await page.goto('/');

    // Verify we are on the landing page
    await expect(page.locator('h1')).toContainText('Your Unfair Advantage');
    
    // 2. Click "Launch CaseEdge"
    await page.getByRole('button', { name: 'Launch CaseEdge' }).first().click();

    // Verify user guide shows up, then click "Skip guide"
    await expect(page.getByRole('heading', { name: 'Quick Guide' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip guide' }).click();
    await expect(page.getByRole('heading', { name: 'Quick Guide' })).not.toBeVisible();

    // 3. Complete Case Intake
    const casePrompt = 'Our client is a major US airline. Despite relatively stable revenue and passenger volumes over the last two years, their overall profitability has declined by 15%. The CEO hired us to determine the root cause of this decline and to recommend strategies to return to historical profit margins.';
    await page.locator('textarea[placeholder*="Paste case prompt"]').fill(casePrompt);
    await page.getByRole('button', { name: /Bypass & Auto-Analyze/ }).click();

    // Verify extracted details are visible
    await expect(page.getByRole('heading', { name: 'Case at a Glance', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Core Problem')).toBeVisible();
    await expect(page.locator('text=Airline profitability declined by 15% despite stable revenue.')).toBeVisible();

    // Click "Continue to Issue Tree"
    await page.getByRole('button', { name: 'Continue to Issue Tree' }).click();

    // 4. Issue Tree Page
    // Switch to AI Generated Tree tab to trigger AI logic check in E2E
    await page.getByRole('button', { name: 'AI Generated Tree' }).click();

    // Click Bypass & Unlock to build the AI tree
    await page.getByRole('button', { name: /Bypass & Unlock/ }).click();

    // Let's wait for the tree nodes to render.
    await expect(page.locator('text=Decline in Airline Profitability')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Revenue Drivers')).toBeVisible();
    await expect(page.locator('text=Cost Drivers')).toBeVisible();

    // Click "Select Frameworks"
    await page.getByRole('button', { name: 'Select Frameworks' }).click();

    // 5. Frameworks Page
    // Switch to Auto-Generate tab to bypass Socratic Guide in E2E
    await page.getByRole('button', { name: 'Auto-Generate Recommendations' }).click();

    // Click Bypass & Unlock to generate the AI recommendations
    await page.getByRole('button', { name: /Bypass & Unlock/ }).click();

    // Let's wait for the Profitability Framework card.
    await expect(page.locator('text=Profitability Framework')).toBeVisible({ timeout: 5000 });

    // Hover over the first card and click "Use This Framework" to activate it
    await page.locator('.group').first().hover();
    await page.locator('button:has-text("Use This Framework")').first().click();

    // Verify framework is active
    await expect(page.locator('text=Active Frameworks')).toBeVisible();

    // Click "Draft Recommendation"
    await page.getByRole('button', { name: 'Draft Recommendation' }).click();

    // 6. Recommendation Drafter Page
    await page.locator('input[placeholder*="M&A target acquisition"]').fill('Acquire regional airlines to consolidate domestic market share.');
    await page.locator('input[placeholder*="Synergies will increase"]').fill('Consolidation will improve operating profit margins by 5%.');
    await page.locator('input[placeholder*="Re-allocates 85%"]').fill('Merge fleet routes to optimize flight crew scheduling.');
    await page.locator('input[placeholder*="Union friction mitigated"]').fill('Engage labor union leadership early to align crew guarantees.');
    
    // Format recommendation as SCR
    await page.getByRole('button', { name: 'Combine & Format as SCR' }).click();

    // Verify SCR structured response
    await expect(page.locator('text=Recommendation (SCR Format)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Our client is experiencing a 15% profit decline.')).toBeVisible();

    // Proceed to Slide Outline
    await page.getByRole('button', { name: 'Generate Slide Outline' }).click();

    // 7. Slide Outline Page
    // Click Generate Deck Structure button explicitly
    await page.getByRole('button', { name: 'Generate Deck Structure' }).click();

    // Let's check for slide content.
    await expect(page.locator('text=Executive Summary')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Situation & Complication')).toBeVisible();

    // Proceed to Q&A
    await page.getByRole('button', { name: 'Continue to Judge Q&A' }).click();

    // 8. Judge Q&A Page
    // Click Start Q&A Simulator Drill explicitly
    await page.getByRole('button', { name: 'Start Q&A Simulator Drill' }).click();

    // Let's verify Question 1 cards.
    await expect(page.locator('text=Question 1')).toBeVisible({ timeout: 5000 });

    // Click the first card to flip it
    await page.locator('.perspective-1000').first().click();

    // Click Skip & Reveal Answer to unlock the buttons
    await page.getByRole('button', { name: 'Skip & Reveal Answer' }).first().click();

    // Verify that the flipped back card shows model answer actions
    await expect(page.getByRole('button', { name: 'Got this' }).first()).toBeVisible();

    // Click "Got this"
    await page.getByRole('button', { name: 'Got this' }).first().click();

    // Verify progress tracking updates
    await expect(page.locator('text=1/2 Mastered')).toBeVisible();
  });
});
