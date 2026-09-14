// Robust customer interaction script: bypass splash/login, find product links, add to cart, verify
(async ()=>{
  const fs = require('fs');
  const path = require('path');
  const { chromium } = require('playwright');
  const root = path.resolve(__dirname, '..');
  const screenshotsDir = path.join(root, 'screenshots', 'customer');
  fs.mkdirSync(screenshotsDir, { recursive: true });
  const logsDir = path.join(root, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  const result = { steps: [], success: false, timestamp: new Date().toISOString() };
  const urlBase = process.env.URL || 'http://localhost:8082';
  let browser;
  try{
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

    // 1. Open root and try to bypass login (click "Skip") then go to catalog
    await page.goto(urlBase + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'root-before.png') });
    result.steps.push({ name: 'open-root', url: urlBase + '/' });

    const bypassSelectors = ['text=Skip', 'a:has-text("Skip")', 'button:has-text("Skip")', 'a.skip-link'];
    for(const s of bypassSelectors){
      try{
        const el = await page.$(s);
        if(el){ await el.click(); result.steps.push({ name: 'clicked-skip', selector: s }); break; }
      }catch(e){ }
    }

    // navigate to catalog after bypass attempt
    await page.goto(urlBase + '/catalog', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'catalog-before.png') });
    result.steps.push({ name: 'open-catalog', url: urlBase + '/catalog', ok: true });

    // 2. Try to find product links by scanning anchor hrefs for '/product/' with retries for lazy-loaded content
    let productHref = null;
    const maxAttempts = 20;
    for(let i=0;i<maxAttempts;i++){
      productHref = await page.evaluate(()=>{
        const anchors = Array.from(document.querySelectorAll('a'));
        const found = anchors.map(a=>a.getAttribute('href') || a.href).find(h=>h && h.toString().includes('/product/'));
        return found || null;
      });
      if(productHref) break;
      await page.waitForTimeout(500);
    }
    if(!productHref){
      result.steps.push({ name: 'find-product-failed', reason: 'no product href found after retries' });
      throw new Error('No product link found on catalog');
    }

    // 3. Open product page using href
    const target = productHref.startsWith('http') ? productHref : (urlBase + (productHref.startsWith('/') ? productHref : ('/' + productHref)));
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'product-page.png') });
    result.steps.push({ name: 'open-product', ok: true, url: page.url() });

    // 4. Click Add to cart (try multiple button selectors)
    const addSelectors = ['button:has-text("Add to cart")', 'button:has-text("Add to basket")', 'button[aria-label*="Add to cart"]', 'button.add-to-cart', 'button:has-text("ADD TO CART")'];
    let added = false;
    for(const s of addSelectors){
      try{
        const btn = await page.$(s);
        if(btn){
          await btn.click();
          added = true;
          result.steps.push({ name: 'clicked-add', selector: s });
          break;
        }
      }catch(e){ /* continue */ }
    }
    if(!added){
      result.steps.push({ name: 'add-to-cart-failed', reason: 'no add button found' });
      throw new Error('Add to cart button not found');
    }

    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'after-add.png') });

    // 5. Open cart and verify item
    await page.goto(urlBase + '/cart', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'cart.png') });
    const cartSelectors = ['.cart-item', '.line-item', 'li.cart-item', '.cart-row', '.cart-product'];
    let foundInCart = false;
    for(const cs of cartSelectors){
      const el = await page.$(cs);
      if(el){ foundInCart = true; result.steps.push({ name: 'cart-has-item', selector: cs }); break; }
    }
    if(!foundInCart){ result.steps.push({ name: 'cart-verify-failed' }); throw new Error('No items found in cart'); }

    result.success = true;
    await browser.close();
  }catch(err){
    result.error = (err && err.stack) ? err.stack : String(err);
    if(browser) try{ await browser.close(); }catch(e){}
  }
  // write result file
  const out = path.join(root, 'logs', 'customer-interactions-result.json');
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
})();
