// src/social/card.tsx

import type { ReactElement, ReactNode } from 'react';
import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import sharp from 'sharp';
import { formatText } from '@/lib/format';
import { SITE_URL } from '@/lib/seo';
import type { Incident } from '@/types';
import {
  CONTENT_WIDTH,
  COVER,
  END_SLIDE,
  coverBadgeSize,
  coverNameSize,
  coverRoleSize,
  coverTitleSize,
  endLabelSize,
  evidenceImages,
  IMAGE,
  MARGIN,
  PAGE,
  PAGE_BOX,
  SIGNATURE,
  TEXT,
  blockGap,
  blockIndent,
  blockScale,
  subjectSize,
  textBlocks,
  textPages,
  wordGap,
  type TextPage,
} from './slides';
import type { Block, Piece } from './richtext';

/**
 * Instagram images of a fiche (see slides.ts for the layout), rendered on
 * the server as JPEG, the only image format the Instagram API accepts. The
 * cover has the same design as the "Story" button of the fiche's page
 * (src/components/InstagramButton.tsx).
 */

const STRAPI_HOST = process.env.NEXT_PUBLIC_STRAPI_HOST || 'https://api.nopasaran.ch';

type Font = { name: string; data: ArrayBuffer; weight: 500 | 700 | 900; style: 'normal' | 'italic' };

// The faces of Inter the images use (the same as metrics.ts).
const FACES = [
  { weight: 500, style: 'normal', axes: 'wght@500' },
  { weight: 700, style: 'normal', axes: 'wght@700' },
  { weight: 900, style: 'normal', axes: 'wght@900' },
  { weight: 500, style: 'italic', axes: 'ital,wght@1,500' },
  { weight: 700, style: 'italic', axes: 'ital,wght@1,700' },
] as const;

// Inter is fetched from Google Fonts once per server instance: the image
// renderer only ships a regular font. A failure is not kept: the image fails
// (Instagram then refuses the post, retried on the next run) rather than
// going out in the wrong font, and the next image tries again.
let fonts: Promise<Font[]> | null = null;

// The connection to Google Fonts fails now and then: one more try.
async function fetchWithRetry(url: string): Promise<Response> {
  try {
    const response = await fetch(url);
    if (response.ok) return response;
  } catch {
    // Tried again below.
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

async function loadFonts(): Promise<Font[]> {
  return Promise.all(
    FACES.map(async ({ weight, style, axes }) => {
      const css = await (await fetchWithRetry(`https://fonts.googleapis.com/css2?family=Inter:${axes}`)).text();
      const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
      if (!url) throw new Error(`Font Inter ${axes}: no TrueType file in the stylesheet.`);
      const data = await (await fetchWithRetry(url)).arrayBuffer();
      return { name: 'Inter', data, weight, style };
    })
  );
}

function getFonts(): Promise<Font[]> {
  fonts ??= loadFonts().catch(error => {
    fonts = null;
    throw error;
  });
  return fonts;
}

interface FittedImage {
  src: string;
  width: number;
  height: number;
}

// Remote image as a PNG data URL, resized to fit the box (cropped when
// square). The renderer cannot read every format Strapi stores (WebP), so
// everything goes through sharp.
async function fetchImage(url: string, width: number, height: number, square = false): Promise<FittedImage | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const { data, info } = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(width, height, { fit: square ? 'cover' : 'inside' })
      .png()
      .toBuffer({ resolveWithObject: true });
    return { src: `data:image/png;base64,${data.toString('base64')}`, width: info.width, height: info.height };
  } catch {
    return null;
  }
}

function absolute(url: string): string {
  return url.startsWith('http') ? url : `${STRAPI_HOST}${url}`;
}

// Every image: the same background and the same margins.
function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: MARGIN.top,
        paddingBottom: MARGIN.bottom,
        color: 'white',
        fontFamily: 'Inter',
        background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
      }}
    >
      {children}
    </div>
  );
}

async function toJpeg(image: ReactElement): Promise<Buffer> {
  const png = new ImageResponse(image, { width: IMAGE.width, height: IMAGE.height, fonts: await getFonts() });
  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 88 }).toBuffer();
}

/**
 * One image of a fiche: "cover", "text-<n>", "evidence-<n>" or "end". null
 * when the fiche has no such image.
 */
export async function renderSlide(incident: Incident, locale: string, slide: string): Promise<Buffer | null> {
  const [, kind, number] = slide.match(/^(cover|text|evidence|end)(?:-(\d+))?$/) ?? [];
  const index = Number(number ?? 1) - 1;
  const logo = fetchImage(`${SITE_URL}/icon.png`, 160, 160, true);

  if (kind === 'cover') return toJpeg(await cover(incident, locale, await logo));
  if (kind === END_SLIDE) return toJpeg(await end(locale));

  if (kind === 'text') {
    const tIncident = await getTranslations({ locale, namespace: 'IncidentPage' });
    const pages = textPages(textBlocks(incident, tIncident('consequencesTitle')));
    return pages[index] ? toJpeg(textPage(incident, pages[index], pages.length > 1, await logo)) : null;
  }

  if (kind === 'evidence') {
    const image = evidenceImages(incident)[index];
    if (!image) return null;
    const fitted = await fetchImage(absolute(image.url), PAGE_BOX.width, PAGE_BOX.height);
    if (!fitted) throw new Error(`Evidence image ${index + 1} could not be loaded.`);
    return toJpeg(evidencePage(incident, fitted, await logo));
  }

  return null;
}

// ---- Cover ----

async function cover(incident: Incident, locale: string, logo: FittedImage | null) {
  const tCats = await getTranslations({ locale, namespace: 'Categories' });
  const tParties = await getTranslations({ locale, namespace: 'Parties' });

  const title = formatText(incident.title);
  const subject = incident.sujet?.name ?? null;
  const category = incident.category
    ? tCats.has(incident.category) ? tCats(incident.category) : incident.category
    : null;
  const date = new Date(incident.incident_date).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const badgeSize = coverBadgeSize(category, date);
  // Under the picture, as on the fiche's page: role, then party and canton.
  const role = incident.subject_role
    ? incident.subject_role.charAt(0).toUpperCase() + incident.subject_role.slice(1)
    : null;
  // "None" and "Other" say nothing on an image: left out.
  const affiliation = incident.sujet?.affiliation;
  const party =
    affiliation && affiliation !== 'None' && affiliation !== 'Other'
      ? tParties.has(affiliation) ? tParties(affiliation) : affiliation
      : null;
  // "(UDC - GE)", after the name.
  const partyAndCanton = [party, incident.sujet?.canton].filter(Boolean).join(' - ');
  const nameSuffix = partyAndCanton ? `(${partyAndCanton})` : '';

  // Same picture as the Story: the subject's, else the first evidence image.
  const pictureUrl = incident.sujet?.picture?.url ?? incident.evidence_image?.[0]?.url;
  const picture = pictureUrl
    ? await fetchImage(absolute(pictureUrl), COVER.pictureSize, COVER.pictureSize, true)
    : null;

  const badge = {
    display: 'flex',
    borderRadius: 16,
    padding: `${Math.round(badgeSize * 0.35)}px 32px`,
    fontSize: badgeSize,
  };

  return (
    <Frame>
      {/* Category and date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: COVER.badgesHeight }}>
        {category && (
          <div
            style={{
              ...badge,
              background: '#dc2626',
              border: '1px solid #ef4444',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {category}
          </div>
        )}
        <div style={{ ...badge, background: 'rgba(255,255,255,0.2)', color: '#e5e7eb', fontWeight: 500 }}>
          {date}
        </div>
      </div>

      {/* Title, centered in a box of fixed height */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: CONTENT_WIDTH,
          height: COVER.textBoxHeight,
          marginTop: COVER.textBoxTop,
          textAlign: 'center',
          fontSize: coverTitleSize(title),
          fontWeight: 900,
          lineHeight: COVER.titleLineHeight,
        }}
      >
        {title}
      </div>

      {/* Picture: same size and position on every cover */}
      <div style={{ display: 'flex', width: COVER.pictureSize, height: COVER.pictureSize, marginTop: COVER.pictureTop }}>
        {picture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={picture.src}
            width={COVER.pictureSize}
            height={COVER.pictureSize}
            alt=""
            style={{ borderRadius: 32, border: '4px solid rgba(75,85,99,0.5)' }}
          />
        )}
      </div>

      {/* Subject: "Name (UDC - GE)", then the role */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: COVER.subjectTop }}>
        {subject && (
          <div style={{ display: 'flex', fontSize: coverNameSize(subject, nameSuffix), whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 700 }}>{subject}</span>
            {/* The renderer drops spaces at the edge of a text run: a
                non-breaking space keeps this one. */}
            {nameSuffix && <span style={{ fontWeight: 500, color: '#d1d5db' }}>{`\u00A0${nameSuffix}`}</span>}
          </div>
        )}
        {role && (
          <div
            style={{
              display: 'flex',
              marginTop: 8,
              fontSize: coverRoleSize(role),
              fontWeight: 500,
              color: '#d1d5db',
              whiteSpace: 'nowrap',
            }}
          >
            {role}
          </div>
        )}
      </div>

      {/* Same place as on the text and evidence images */}
      <Signature logo={logo} marginTop="auto" />
    </Frame>
  );
}

// ---- Text and evidence images ----

// Small logo and address at the bottom of every image but the closing one,
// so that an image shared alone still says where it comes from.
function Signature({ logo, marginTop }: { logo: FittedImage | null; marginTop: number | 'auto' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: SIGNATURE.height,
        marginTop,
        padding: '0 28px 0 8px',
        borderRadius: SIGNATURE.height / 2,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
      }}
    >
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.src}
          width={SIGNATURE.logo}
          height={SIGNATURE.logo}
          alt=""
          style={{ borderRadius: SIGNATURE.logo / 2, background: 'white', padding: 5 }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 26, fontWeight: 900, letterSpacing: 1 }}>nopasaran.ch</div>
        <div style={{ display: 'flex', marginTop: 4, fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#d1d5db' }}>
          THE WALL OF SHAME
        </div>
      </div>
    </div>
  );
}

// `top`: the body starts at the top of its box instead of being centered,
// for a text that continues from one image to the next.
function pageFrame(incident: Incident, logo: FittedImage | null, body: ReactNode, top = false) {
  const subject = incident.sujet?.name ?? '';
  return (
    <Frame>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: PAGE.headerHeight,
          fontSize: subjectSize(subject, 30, PAGE.headerLetterSpacing),
          fontWeight: 700,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: PAGE.headerLetterSpacing,
          whiteSpace: 'nowrap',
        }}
      >
        {subject}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: top ? 'flex-start' : 'center',
          alignItems: 'center',
          width: PAGE_BOX.width,
          height: PAGE_BOX.height,
          marginTop: PAGE.gap,
          overflow: 'hidden',
        }}
      >
        {body}
      </div>
      <Signature logo={logo} marginTop={PAGE.gap} />
    </Frame>
  );
}

// Words laid out one by one, so that each keeps its style and the lines
// break where slides.ts expects them to.
function Words({ pieces, fontSize }: { pieces: Piece[]; fontSize: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', flexGrow: 1, flexBasis: 0, columnGap: wordGap(fontSize) }}>
      {pieces.map((piece, index) =>
        piece === 'break' ? (
          <div key={index} style={{ display: 'flex', width: '100%', height: 0 }} />
        ) : (
          <div key={index} style={{ display: 'flex', maxWidth: '100%', wordBreak: 'break-all' }}>
            {piece.map((segment, part) => (
              <span
                key={part}
                style={{
                  fontWeight: segment.face === 700 || segment.face === '700i' ? 700 : 500,
                  fontStyle: segment.face === '500i' || segment.face === '700i' ? 'italic' : 'normal',
                  textDecoration: segment.link ? 'underline' : 'none',
                }}
              >
                {segment.text}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// Styles of the blocks, after the fiche's page on the site.
function TextBlockView({ block, fontSize }: { block: Block; fontSize: number }) {
  const size = fontSize * blockScale(block);
  const words = <Words pieces={block.pieces} fontSize={size} />;

  if (block.kind === 'section') {
    return (
      <div style={{ display: 'flex', fontSize: size, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 3 }}>
        {block.pieces.map(piece => (piece === 'break' ? '' : piece.map(segment => segment.text).join(''))).join(' ')}
      </div>
    );
  }
  if (block.kind === 'item') {
    return (
      <div style={{ display: 'flex', width: '100%', fontSize: size }}>
        <div style={{ display: 'flex', width: blockIndent(block, fontSize), color: '#9ca3af' }}>{block.marker ?? ''}</div>
        {words}
      </div>
    );
  }
  if (block.kind === 'quote') {
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          fontSize: size,
          color: '#e5e7eb',
          borderLeft: `${TEXT.quoteBorder}px solid #4b5563`,
          paddingLeft: blockIndent(block, fontSize) - TEXT.quoteBorder,
        }}
      >
        {words}
      </div>
    );
  }
  // Paragraph, or subheading (bold, a little larger).
  return <div style={{ display: 'flex', width: '100%', fontSize: size }}>{words}</div>;
}

function textPage(incident: Incident, page: TextPage, continued: boolean, logo: FittedImage | null) {
  const { fontSize } = page;
  return pageFrame(
    incident,
    logo,
    page.blocks.map((block, index) => (
      <div
        key={index}
        style={{
          display: 'flex',
          width: '100%',
          marginTop: blockGap(page.blocks[index - 1], block, fontSize),
          lineHeight: TEXT.lineHeight,
          fontWeight: 500,
          color: '#f3f4f6',
        }}
      >
        <TextBlockView block={block} fontSize={fontSize} />
      </div>
    )),
    continued
  );
}

function evidencePage(incident: Incident, image: FittedImage, logo: FittedImage | null) {
  return pageFrame(
    incident,
    logo,
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image.src} width={image.width} height={image.height} alt="" style={{ borderRadius: 16 }} />
  );
}

// ---- Closing image ----

// The same for every carousel: logo, "À lire sur nopasaran.ch", and the
// link in bio.
async function end(locale: string) {
  const t = await getTranslations({ locale, namespace: 'Social' });
  const logo = await fetchImage(`${SITE_URL}/icon.png`, 320, 320, true);
  const label = t('endLabel');
  const domain = 'nopasaran.ch';
  const [prefix, suffix = ''] = label.split(domain);

  return (
    <Frame>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo.src}
            width={300}
            height={300}
            alt=""
            style={{ borderRadius: 150, background: 'white', padding: 20, boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
          />
        )}
        <div style={{ display: 'flex', marginTop: 80, fontSize: endLabelSize(label), fontWeight: 500, letterSpacing: 1 }}>
          {/* The renderer drops spaces at the edge of a text run: keep them
              as non-breaking spaces. */}
          {prefix.replace(/ $/, '\u00A0')}
          <span style={{ fontWeight: 900 }}>{domain}</span>
          {suffix.replace(/^ /, '\u00A0')}
        </div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 28, fontWeight: 700, letterSpacing: 10, color: '#d1d5db' }}>
          THE WALL OF SHAME
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 80,
            padding: '14px 40px',
            borderRadius: 16,
            background: '#dc2626',
            border: '1px solid #ef4444',
            fontSize: 34,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {t('linkInBio')}
        </div>
      </div>
    </Frame>
  );
}
