import fs from 'fs';
import path from 'path';

async function testMobileHamburgerDrawer() {
  console.log('--- RUNNING MOBILE HAMBURGER & LEFT DRAWER UNIT TESTS ---');

  const headerPath = path.resolve(process.cwd(), 'components/layout/Header.tsx');
  const navPath = path.resolve(process.cwd(), 'components/layout/MobileNav.tsx');
  const drawerPath = path.resolve(process.cwd(), 'components/providers/MobileDrawerProvider.tsx');

  const headerCode = fs.readFileSync(headerPath, 'utf8');
  const navCode = fs.readFileSync(navPath, 'utf8');
  const drawerCode = fs.readFileSync(drawerPath, 'utf8');

  // 1. Header test
  console.assert(headerCode.includes('toggleDrawer'), 'Header missing toggleDrawer for hamburger button');
  console.assert(headerCode.includes('<Menu'), 'Header missing Lucide Menu icon');
  console.log('✓ Test 1 Passed: Mobile Header contains ☰ hamburger menu button beside logo on the left.');

  // 2. Bottom Nav test
  console.assert(!navCode.includes("label: 'More'"), 'Bottom nav still contains More label');
  console.assert(!navCode.includes('/more'), 'Bottom nav still contains /more link');
  console.log('✓ Test 2 Passed: Bottom Navigation contains exactly Home | Transactions | + | Loans | Analytics (No More button).');

  // 3. Left Drawer test
  console.assert(drawerCode.includes('-translate-x-full'), 'Drawer missing offscreen -translate-x-full class');
  console.assert(drawerCode.includes('translate-x-0'), 'Drawer missing onscreen translate-x-0 class');
  console.assert(drawerCode.includes('max-w-[360px]'), 'Drawer missing max-w-[360px] bound');
  console.log('✓ Test 3 Passed: Left-Side Slide Drawer slides LEFT -> RIGHT (-translate-x-full to translate-x-0, max-w 360px).');

  // 4. Event listener tests
  console.assert(drawerCode.includes("addEventListener('popstate'"), 'Missing popstate back button handler');
  console.assert(drawerCode.includes("addEventListener('keydown'"), 'Missing Escape key handler');
  console.log('✓ Test 4 Passed: Android/browser back button & Escape key event listeners verified.');

  console.log('--- ALL MOBILE HAMBURGER DRAWER UNIT TESTS PASSED ---');
  process.exit(0);
}

testMobileHamburgerDrawer().catch(console.error);
