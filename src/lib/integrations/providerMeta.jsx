'use client';

export const ProviderIcons = {
  wordpress: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM2.292 12c0-1.17.204-2.292.576-3.337l3.176 8.7A9.712 9.712 0 012.292 12zm9.708 9.708a9.708 9.708 0 01-2.74-.394l2.91-8.455 2.98 8.164a.977.977 0 00.073.14 9.706 9.706 0 01-3.223.545zm1.337-14.424c.583-.03 1.109-.09 1.109-.09.522-.062.461-.829-.061-.8 0 0-1.569.122-2.582.122-1.013 0-2.613-.122-2.613-.122-.522-.03-.583.768-.061.8 0 0 .496.06 1.018.09l1.512 4.143-2.123 6.365-3.536-10.508c.582-.03 1.109-.09 1.109-.09.522-.062.461-.829-.061-.8 0 0-1.569.122-2.582.122-.182 0-.396-.005-.623-.012A9.717 9.717 0 0112 2.292c2.537 0 4.85.969 6.588 2.556-.042-.003-.083-.008-.126-.008-1.012 0-1.73.882-1.73 1.829 0 .85.49 1.567.583 1.829.09.261.706 2.122.583 2.706l-.767 2.56-2.794-8.48zm4.572 9.944l2.952-8.53c.55-1.376.735-2.474.735-3.453 0-.355-.023-.685-.065-1.002A9.716 9.716 0 0121.708 12c0 2.45-.905 4.688-2.399 6.398l-.4-1.17z" fill="#21759B"/>
    </svg>
  ),
  whatsapp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  google_gmail: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
    </svg>
  ),
  google_calendar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.316 5.684H24v12.632h-5.684z" fill="#EA4335"/>
      <path d="M5.684 24h12.632v-5.684H5.684z" fill="#34A853"/>
      <path d="M0 18.316h5.684V5.684H0z" fill="#4285F4"/>
      <path d="M24 5.684H5.684V0L24 0z" fill="#FBBC04"/>
      <path d="M0 5.684h5.684V0H0z" fill="#188038"/>
      <path d="M5.684 18.316h12.632V5.684H5.684z" fill="#fff"/>
      <path d="M5.684 0v5.684H0z" fill="#1967D2"/>
      <path d="M12.36 8.4c1.178 0 2.124.492 2.7 1.332l-1.068.972c-.348-.528-.876-.816-1.572-.816-1.116 0-1.956.876-1.956 2.112s.84 2.112 1.956 2.112c.864 0 1.44-.396 1.68-1.008H12.36v-1.32h3.252c.036.216.06.444.06.684C15.672 14.1 14.256 15.3 12.36 15.3c-2.004 0-3.48-1.44-3.48-3.3s1.476-3.3 3.48-3.3z" fill="#4285F4"/>
    </svg>
  ),
  google_drive: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.433 22.396l2.756-4.772H24l-2.756 4.772z" fill="#34A853"/>
      <path d="M0 15.094L2.756 19.866 9.978 7.353l-2.756-4.772z" fill="#4285F4"/>
      <path d="M9.978 7.353l7.222 12.513h5.522L15.5 7.353z" fill="#FBBC04"/>
      <path d="M9.978 7.353L7.222 2.581H2.756L9.978 7.353z" fill="#EA4335"/>
    </svg>
  ),
  google_sheets: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.727 0H3.272A1.09 1.09 0 002.18 1.09v21.818c0 .603.49 1.092 1.091 1.092h17.455c.602 0 1.09-.49 1.09-1.09V7.09L14.727 0z" fill="#23A566"/>
      <path d="M14.727 0l7.09 7.09h-7.09z" fill="#1C8C56"/>
      <path d="M7.636 12H16.364v1.455H7.636zm0 2.91H16.364v1.454H7.636zm0 2.908H13.09v1.455H7.636z" fill="#fff"/>
      <path d="M7.636 9.09H16.364v1.456H7.636z" fill="#fff"/>
    </svg>
  ),
  clickup: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.214 17.907l2.76-2.121c1.524 1.983 3.139 2.896 4.898 2.896 1.752 0 3.35-.903 4.85-2.862l2.783 2.092C14.462 20.443 12.006 22 8.872 22c-3.138 0-5.617-1.558-7.658-4.093z" fill="#8930FD"/>
      <path d="M8.872 2l6.256 5.725-2.12 2.314-4.136-3.785-4.115 3.779-2.13-2.307L8.872 2z" fill="#49CDF5"/>
    </svg>
  ),
  telegram: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.368l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.963.191z" fill="#229ED9"/>
    </svg>
  ),
  slack: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" fill="#E01E5A"/>
    </svg>
  ),
  hubspot: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.006 9.373a4.215 4.215 0 00-2.872-1.109 4.188 4.188 0 00-1.696.358V5.995a1.396 1.396 0 00.83-1.27V4.58a1.397 1.397 0 00-1.396-1.397h-.144a1.397 1.397 0 00-1.397 1.397v.145c0 .56.33 1.044.81 1.27v2.668a4.2 4.2 0 00-1.557.765L7.42 4.858a1.56 1.56 0 00.033-.302 1.564 1.564 0 10-1.563 1.563 1.55 1.55 0 00.769-.21l7.266 4.416a4.218 4.218 0 00.086 4.093l-2.115 2.115a1.565 1.565 0 00-.444-.069 1.574 1.574 0 101.574 1.574 1.565 1.565 0 00-.069-.444l2.085-2.085a4.225 4.225 0 006.964-3.136z" fill="#FF7A59"/>
    </svg>
  ),
  notion: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" fill="#000"/>
    </svg>
  ),
  pipedrive: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.1 0C6.579 0 2.1 4.494 2.1 10.035c0 5.19 3.9 9.477 8.934 10.012V24h2.171v-3.953C18.237 19.52 22.1 15.228 22.1 10.035 22.1 4.494 17.621 0 12.1 0zm.02 18.097c-4.428 0-8.02-3.602-8.02-8.044 0-4.441 3.592-8.044 8.02-8.044 4.427 0 8.02 3.603 8.02 8.044 0 4.442-3.593 8.044-8.02 8.044z" fill="#1A73E8"/>
    </svg>
  ),
  property_catalog: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export const providerMeta = {
  whatsapp:         { Icon: ProviderIcons.whatsapp,        color: '#25D366', label: 'WhatsApp' },
  telegram:         { Icon: ProviderIcons.telegram,        color: '#229ED9', label: 'Telegram' },
  google_gmail:     { Icon: ProviderIcons.google_gmail,    color: '#EA4335', label: 'Gmail' },
  google_drive:     { Icon: ProviderIcons.google_drive,    color: '#4285F4', label: 'Google Drive' },
  google_sheets:    { Icon: ProviderIcons.google_sheets,   color: '#34A853', label: 'Google Sheets' },
  google_calendar:  { Icon: ProviderIcons.google_calendar, color: '#4285F4', label: 'Google Calendar' },
  clickup:          { Icon: ProviderIcons.clickup,         color: '#7B68EE', label: 'ClickUp' },
  slack:            { Icon: ProviderIcons.slack,           color: '#E01E5A', label: 'Slack' },
  hubspot:          { Icon: ProviderIcons.hubspot,         color: '#FF7A59', label: 'HubSpot' },
  notion:           { Icon: ProviderIcons.notion,          color: '#6b7280', label: 'Notion' },
  pipedrive:        { Icon: ProviderIcons.pipedrive,       color: '#1A73E8', label: 'Pipedrive' },
  wordpress:        { Icon: ProviderIcons.wordpress,       color: '#21759B', label: 'WordPress Imóveis' },
  property_catalog: { Icon: ProviderIcons.property_catalog, color: '#14b8a6', label: 'Catálogo de Imóveis' },
};

const TOOL_PREFIX_TO_PROVIDER = [
  ['google_drive_',    'google_drive'],
  ['google_sheets_',   'google_sheets'],
  ['google_calendar_', 'google_calendar'],
  ['gmail_',           'google_gmail'],
  ['clickup_',         'clickup'],
  ['telegram_',        'telegram'],
  ['slack_',           'slack'],
  ['hubspot_',         'hubspot'],
  ['notion_',          'notion'],
  ['pipedrive_',       'pipedrive'],
  ['whatsapp_',           'whatsapp'],
  ['wordpress_',          'wordpress'],
  ['property_catalog_',   'property_catalog'],
];

export function toolsToProviderKeys(allowList = []) {
  const found = new Set();
  for (const toolName of allowList) {
    const clean = toolName.replace(/^[^_]+__/, '');
    for (const [prefix, providerKey] of TOOL_PREFIX_TO_PROVIDER) {
      if (clean.startsWith(prefix)) {
        found.add(providerKey);
        break;
      }
    }
  }
  return [...found];
}

export function AgentProviderIcons({ providerKeys = [], size = 20, max = 5 }) {
  const visible = providerKeys.slice(0, max);
  const overflow = providerKeys.length - visible.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {visible.map((key) => {
        const meta = providerMeta[key];
        if (!meta) return null;
        const { Icon, color, label } = meta;
        return (
          <div
            key={key}
            title={label}
            style={{
              width: size + 8,
              height: size + 8,
              borderRadius: '50%',
              background: `${color}18`,
              border: `1px solid ${color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'default',
            }}
          >
            <Icon size={size - 4} />
          </div>
        );
      })}
      {overflow > 0 && (
        <div
          title={`+${overflow} conectores`}
          style={{
            width: size + 8,
            height: size + 8,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#8d97b0',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
