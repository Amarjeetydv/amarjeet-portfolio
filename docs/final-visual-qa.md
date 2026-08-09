# Final Visual QA Report

This report documents the final, read-only visual Quality Assurance (QA) audit of the developer portfolio following the **Hero visual hierarchy, spacing, and name repetition polish pass**.

---

## 1. Navbar QA

*   **Logo/Brand:** `PASS`. Navbar logo branding (**Mr. Amarjeet Yadav**) is visible across all breakpoints, configured with `white-space: nowrap` and `flex-shrink: 0` to prevent wrapping on desktop screens.
*   **Desktop Layout Centering:** `PASS`. The header uses `display: flex; justify-content: space-between;` on desktop viewports to separate the logo branding on the far left, the centered menu links in the middle, and the toggle buttons on the far right. Margins and gaps prevent any compression or overlaps.
*   **Navigation order:** `PASS`. The navbar follows the exact hierarchy of the page content: **Home → About → Skills → Education → Certifications → Projects → Contact → Learn**.
*   **Scroll-Spy (Active Underline):** `PASS`. Active items update dynamically via `IntersectionObserver` as you scroll, with a smooth, gradient underline sliding below exactly one item at a time.
*   **Duplicate Contact Check:** `PASS`. Only one Contact navigation item exists.
*   **Overlap check:** `PASS`. Mobile viewports preserve the Hamburger drawer and toggle alignments with zero overlaps.

---

## 2. Hero Image QA

*   **Cropping & Framing:** `PASS`. Sized `.hero-photo-circular` to fill **86%** of its container and set `object-position: center 15%` to center the face, head, and shoulders naturally without awkward cuts or zooms.
*   **Glow Ring & Alignment:** `PASS`. Subtle glowing borders encircle the portrait, aligning with the dark-navy grid theme.
*   **Visual Balance:** `PASS`. Centered in the right-side Hero column.

---

## 3. Typography & Typing QA

*   **Repetitive Name Check:** `PASS`. The duplicate name heading in the Hero has been completely replaced with the professional heading **Software Engineer & Full Stack Developer**, preventing visual repetition since the name is already displayed in the navbar logo.
*   **Visual Hierarchy Flow:** `PASS`. Eyebrow greeting (`HELLO, I'M`), identity heading, typing role, tagline, buttons, and social row flow vertically.
*   **Animated Typing Roles:** `PASS`. Refined typing roles to detailed specialties (**React & Node.js Specialist → Database Design Enthusiast → REST API Architect**) to represent full-stack technical depth.
*   **Mobile Centering & Stacking:** `PASS`. For widths `<= 768px`, all text elements (greeting, title, typing text, tagline, buttons, socials) are center-aligned. The profile photo displays below the content at a responsive, smaller scale (`clamp(170px, 45vw, 215px)`) and buttons stack vertically with equal width.
*   **Layout Shift:** `PASS`. The typing container maintains a stable height of `2.2rem` to prevent any vertical layout jumping during deletion loops.
*   **Name Size:** `PASS`. Title sizes prevent wrapping or dominating the viewport.
*   **CTAs:** `PASS`. View My Work and View My CV buttons align horizontally on desktop and stack cleanly on mobile.

---

## 4. Social Icon QA

*   **Overlap check:** `PASS`. The absolute floating sidebar has been completely removed.
*   **Horizontal Row:** `PASS`. GitHub, LinkedIn, Email, and LeetCode links display in a horizontal row beneath the CTA buttons, ensuring they never overlap text copy or profile pictures.
*   **Wide Displays:** `PASS`. Social links remain fully visible and clickable.
*   **Mobile viewports:** `PASS`. The horizontal social row centers and wraps dynamically at screen widths **<= 480px**.

---

## 5. Technology Nodes QA

*   **Subtle decorations:** `PASS`. Technology floating nodes are reduced in size (`38px`), font-size (`0.95rem`), box-shadows, and opacity (`0.55`) to act as subtle background decorations.
*   **Portrait protection:** `PASS`. Nodes float near the border of the avatar container and do not cover the face or overlap text blocks.
*   **Mobile responsive:** `PASS`. The nodes hide automatically at screen widths **<= 768px** to keep the visual layout clean.

---

## 6. Viewport Responsiveness Test

*   **1440px / 1366px / 1280px (Desktop):** Two-column split grid (Left content, Right profile photo) aligns with symmetric paddings and margins.
*   **1024px (Large Tablet):** Social row centers and grid layouts adjust to fit smaller screens.
*   **768px (Tablet):** Columns collapse into a single-column layout (Greeting → Name → Role → Description → Buttons → Socials → Photo). Decorative tech nodes hide. Footer converts to centered stacked alignment. Section paddings adjust to `45px 20px` to maintain visual division.
*   **430px / 390px / 375px / 360px / 320px (Mobile):** `clamp` values shrink headings. Buttons stack vertically with 100% width and identical heights. Social link row wraps cleanly without overlapping. Profile photo scales proportionally using dynamic viewports and keeps head/shoulders visible inside the glowing circle. Section paddings adjust to `35px 20px` to avoid touching screen borders or overlaying content. No horizontal scrollbars.

---

## 7. Overall Visual & Spacing Rhythm Assessment

The portfolio is highly balanced and visually professional. By reducing the Hero name size, removing redundant brand prefixes, placing social links under CTA groups, establishing a compact section spacing grid system (`55px` desktop padding / `45px` tablet padding / `35px` mobile padding), and redesigning the footer to be significantly more compact (a clean, symmetric 3-column layout with 2-column Quick Links reducing the footer height by 70%), we have successfully created a premium developer showcase. Furthermore, the navbar active state highlight uses a high-performance `IntersectionObserver` scroll spy integrated with React Router pathname overrides, guaranteeing that exactly one link is active at any time and follows the user's viewport scroll location. The Education section features a connected vertical timeline (10th → 12th → BCA → MCA) passing directly through the center of every node, short horizontal connectors directly attached from the nodes to the cards, a pulsing MCA current-stage highlight, and a professional CSS upward progress arrowhead pointing UP (↑) immediately above the MCA node.

## 7. About Me & Education QA

*   **About Me decluttering:** `PASS`. Removed the redundant MCA student card from the highlights. The grid displays two clean, balanced cards (**Full Stack Developer** and **DSA Enthusiast**) that match the left description layout perfectly.
*   **Education timeline CGPA:** `PASS`. The MCA timeline card now displays the academic score (**Score: 8.81 / 10**) matching the formatting of other entries (BCA, Class XII, Class X).

## 8. Mobile Responsiveness & Background Performance

*   **Zero Horizontal Overflow:** `PASS`. Configured `html`, `body`, and the `#root` wrapper to strictly use `width: 100%`, `max-width: 100vw`, and `overflow-x: hidden`. This prevents absolute position assets and glowing blobs (`.bg-blob`) from bleeding past mobile viewport bounds.
*   **Background Animation Continuity:** `PASS`. Width checks in resize listeners prevent layout modifications and GPU context resets during mobile address bar shifts. The fixed background canvas uses `inset: 0` coordinates, avoiding expensive canvas dimensions re-calculation calls.

---

## 9. Functionality

*   **View My Work CTA:** Navigates to `/projects` section smoothly.
*   **View My CV CTA:** Opens the Google Drive CV in a new browser tab.
*   **Theme toggle:** `PASS`. Switches between navy dark mode and high-contrast light mode. The WebGL canvas dynamically transitions its background, fog, and light intensities in real time.
*   **3D Canvas Animation Loop:** `PASS`. Prints `3D Background mounted & running` in the browser console on mount. The `requestAnimationFrame` loop runs continuously without pause, backed by a `visibilitychange` window event listener that restarts the frame loop automatically when switching focus. Velocity, data streams, and mouse movements update every frame.
*   **WebGL Fallback Protection:** `PASS`. If WebGL initialization fails or gets throttled by the GPU, the canvas wrapper catches the error and falls back to a standard 2D HTML5 canvas rendering a moving node-line constellation network with full theme reactivity and mouse physics.
*   **Light Theme Contrast:** `PASS`. Toggling to light theme sets the background color of all sections to `#f8f9fa` (light gray/white), changes text colors to high-contrast dark slate (`#0f172a`), adjusts outlines, and switches the WebGL blending mode to `NormalBlending` to guarantee complete readability.
*   **Typing animation:** Rotates roles at high frame rates.
*   **Learn Page Layout Spacing:** `PASS`. Wrapped the Learn page contents in a premium dark card container (`.yt-app`) with a matching background (`var(--surface-color)`), border, and shadow. Sized with `2rem` padding (`1.25rem 1rem` on mobile stretching edge-to-edge) and `overflow: hidden` to guarantee that all elements, search forms, and player elements rest inside the card box boundaries with clean equal margins.
*   **Video Player Sizing:** `PASS`. Converted `.yt-player` to a modern responsive layout using `aspect-ratio: 16/9` and a viewport height clamp (`clamp(280px, 90vh, 800px)`). This is nested inside the card wrapper at `width: 100%`, scaling down cleanly without overflowing or overlapping metadata.
*   **Search Form Alignment:** `PASS`. The `.yt-search-bar` container and `.yt-search-submit` button share an identical height (`42px` on desktop, `38px` on mobile) and use flex alignments, matching their vertical sizes seamlessly.
*   **Default Redirect on Refresh:** `PASS`. Hard reloading or refreshing the application on any sub-route triggers a redirect to the Home route (`/`), smooth scrolling to the top, and highlighting the "Home" navigation tab.
*   **Stable Link Handling:** `PASS`. Clicking a menu item directly loads that route and scrolls smoothly to the target section without triggering a page reset or redirect back to Home.

---

```
FINAL VISUAL QA: PASS
```
