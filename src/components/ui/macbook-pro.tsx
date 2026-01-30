import type { SVGProps } from "react"

export interface MacbookProProps extends SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  src?: string
}

export function MacbookPro({
  width = 650,
  height = 400,
  src,
  ...props
}: MacbookProProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="#a4a5a7"
        d="M79.56,13.18h491.32c7.23,0,13.1,5.87,13.1,13.1v336.61H66.46V26.28c0-7.23,5.87-13.1,13.1-13.1Z"
      />

      <path
        fill="#222"
        d="M79.96,14.24h490.45c6.83,0,12.37,5.54,12.37,12.37v336.28H67.59V26.6c0-6.83,5.54-12.37,12.37-12.37Z"
      />

      <path
        fill="#000"
        d="M570.25,15.74H80.34c-6.12,0-11.08,4.96-11.08,11.08v336.07h512.08V26.82c0-6.12-4.96-11.08-11.08-11.08ZM575.74,345.17H74.52V27.31c0-3.31,2.68-5.99,5.99-5.99h489.24c3.31,0,5.99,2.68,5.99,5.99v317.86Z"
      />
      <rect
        fill="currentColor"
        x="74.52"
        y="21.32"
        width="501.22"
        rx="5"
        ry="5"
        height="323.85"
      />
      
      {/* IDE Interface Showcase */}
      <g clipPath="url(#roundedCorners)">
        {/* Dark IDE Background */}
        <rect x="74.52" y="21.32" width="501.22" height="323.85" fill="#1e1e1e"/>
        
        {/* Top Bar */}
        <rect x="74.52" y="21.32" width="501.22" height="30" fill="#2d2d30"/>
        
        {/* Window Controls */}
        <circle cx="90" cy="36" r="5" fill="#ff5f56"/>
        <circle cx="105" cy="36" r="5" fill="#ffbd2e"/>
        <circle cx="120" cy="36" r="5" fill="#27c93f"/>
        
        {/* File Tabs */}
        <rect x="140" y="26" width="80" height="20" rx="3" fill="#1e1e1e"/>
        <text x="180" y="39" textAnchor="middle" fill="#cccccc" fontSize="10" fontFamily="monospace">page.tsx</text>
        
        <rect x="225" y="26" width="80" height="20" rx="3" fill="#2d2d30"/>
        <text x="265" y="39" textAnchor="middle" fill="#969696" fontSize="10" fontFamily="monospace">layout.tsx</text>
        
        {/* Sidebar */}
        <rect x="74.52" y="51.32" width="40" height="293.85" fill="#252526"/>
        
        {/* Code Editor Area */}
        <rect x="114.52" y="51.32" width="361.22" height="293.85" fill="#1e1e1e"/>
        
        {/* Line Numbers */}
        <text x="120" y="70" fill="#858585" fontSize="10" fontFamily="monospace">1</text>
        <text x="120" y="85" fill="#858585" fontSize="10" fontFamily="monospace">2</text>
        <text x="120" y="100" fill="#858585" fontSize="10" fontFamily="monospace">3</text>
        <text x="120" y="115" fill="#858585" fontSize="10" fontFamily="monospace">4</text>
        <text x="120" y="130" fill="#858585" fontSize="10" fontFamily="monospace">5</text>
        
        {/* Code Content */}
        <text x="135" y="70" fill="#569cd6" fontSize="10" fontFamily="monospace">export</text>
        <text x="175" y="70" fill="#dcdcaa" fontSize="10" fontFamily="monospace">function</text>
        <text x="225" y="70" fill="#dcdcaa" fontSize="10" fontFamily="monospace">App()</text>
        <text x="265" y="70" fill="#d4d4d4" fontSize="10" fontFamily="monospace">{"{"}</text>
        
        <text x="145" y="85" fill="#c586c0" fontSize="10" fontFamily="monospace">return</text>
        <text x="185" y="85" fill="#d4d4d4" fontSize="10" fontFamily="monospace">(</text>
        <text x="195" y="85" fill="#9cdcfe" fontSize="10" fontFamily="monospace">{"<div"}</text>
        <text x="235" y="85" fill="#ce9178" fontSize="10" fontFamily="monospace">className</text>
        <text x="285" y="85" fill="#d4d4d4" fontSize="10" fontFamily="monospace">=</text>
        <text x="295" y="85" fill="#ce9178" fontSize="10" fontFamily="monospace">&quot;app&quot;</text>
        <text x="325" y="85" fill="#9cdcfe" fontSize="10" fontFamily="monospace">{">"}</text>
        
        <text x="145" y="100" fill="#9cdcfe" fontSize="10" fontFamily="monospace">{"<h1>"}</text>
        <text x="175" y="100" fill="#ce9178" fontSize="10" fontFamily="monospace">AI-Powered</text>
        <text x="245" y="100" fill="#9cdcfe" fontSize="10" fontFamily="monospace">{"</h1>"}</text>
        
        <text x="145" y="115" fill="#9cdcfe" fontSize="10" fontFamily="monospace">{"</div>"}</text>
        <text x="185" y="115" fill="#d4d4d4" fontSize="10" fontFamily="monospace">)</text>
        
        {/* Terminal/Output Panel */}
        <rect x="114.52" y="280" width="361.22" height="65" fill="#1e1e1e"/>
        <rect x="114.52" y="280" width="361.22" height="2" fill="#007acc"/>
        <text x="120" y="295" fill="#4ec9b0" fontSize="9" fontFamily="monospace">$ npm run dev</text>
        <text x="120" y="310" fill="#cccccc" fontSize="9" fontFamily="monospace">✓ Ready in 2.3s</text>
        <text x="120" y="325" fill="#4ec9b0" fontSize="9" fontFamily="monospace">➜ Local: http://localhost:3000</text>
        <text x="120" y="340" fill="#4ec9b0" fontSize="9" fontFamily="monospace">➜ Network: http://192.168.1.100:3000</text>
        
        {/* Right Panel - File Explorer */}
        <rect x="475.74" y="51.32" width="100" height="293.85" fill="#252526"/>
        <text x="485" y="70" fill="#cccccc" fontSize="9" fontFamily="monospace">EXPLORER</text>
        <text x="485" y="85" fill="#969696" fontSize="8" fontFamily="monospace">▶ src</text>
        <text x="495" y="100" fill="#cccccc" fontSize="8" fontFamily="monospace">app</text>
        <text x="495" y="115" fill="#cccccc" fontSize="8" fontFamily="monospace">components</text>
        <text x="495" y="130" fill="#cccccc" fontSize="8" fontFamily="monospace">lib</text>
        <text x="495" y="145" fill="#cccccc" fontSize="8" fontFamily="monospace">styles</text>
      </g>
      
      {src && (
        <image
          href={src}
          x="74.52"
          y="21.32"
          width="501.22"
          height="323.85"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#roundedCorners)"
        />
      )}
      <rect fill="#1d1d1d" x="69.09" y="350.51" width="512.11" height="12.48" />

      <path
        fill="#000"
        d="M298.14,21.02h54.07v6.5c0,1.56-1.27,2.82-2.82,2.82h-48.42c-1.56,0-2.82-1.27-2.82-2.82v-6.5h0Z"
      />
      <path
        fill="#acadaf"
        d="M19.04,362.77h611.92v10.39c0,5.95-4.83,10.79-10.79,10.79H29.83c-5.95,0-10.79-4.83-10.79-10.79v-10.39h0Z"
      />

      <path
        fill="#080d4c"
        d="M325.11,25.14c-1.99.03-1.99-3.09,0-3.06,1.99-.03,1.99,3.09,0,3.06Z"
      />

      <polygon
        fill="#b9b9bb"
        points="600.06 385.39 567.29 385.39 565.84 383.95 601.82 383.95 600.06 385.39"
      />
      <polygon
        fill="#292929"
        points="598.73 386.82 568.64 386.82 567.32 385.39 600.35 385.39 598.73 386.82"
      />
      <polygon
        fill="#b9b9bb"
        points="82.64 385.39 49.87 385.39 48.43 383.95 84.41 383.95 82.64 385.39"
      />
      <polygon
        fill="#292929"
        points="81.31 386.82 51.23 386.82 49.9 385.39 82.93 385.39 81.31 386.82"
      />
      <path
        fill="#8f9091"
        d="M278.11,362.6h94.05c0,3.63-2.95,6.58-6.58,6.58h-80.89c-3.63,0-6.58-2.95-6.58-6.58h0Z"
      />

      <defs>
        <clipPath id="roundedCorners">
          <rect
            fill="#ffffff"
            x="74.52"
            y="21.32"
            width="501.22"
            height="323.85"
            rx="5"
            ry="5"
          />
        </clipPath>
      </defs>
    </svg>
  )
}
