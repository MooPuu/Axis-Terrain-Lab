import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Solar & Iconsax Inspired Duotone Icon Set
 * Style: 1.5px - 2px crisp outer strokes with smooth rounded caps + 0.28 opacity secondary accent fills.
 */

export const AxisTerrainLabLogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={(size * 670) / 785}
    viewBox="0 0 785 670"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g transform="translate(-1422 -882)">
      <path
        d="M1422 993.669C1422 931.996 1472 882 1533.67 882L2095.33 882C2157 882 2207 931.996 2207 993.669L2207 1440.33C2207 1502 2157 1552 2095.33 1552L1533.67 1552C1472 1552 1422 1502 1422 1440.33Z"
        fill="#0B3041"
        fillRule="evenodd"
      />
      <path d="M1497 1382 1688.5 1052 1880 1382Z" fill="#156082" fillRule="evenodd" />
      <path d="M1755 1382 1946.5 1052 2138 1382Z" fill="#156082" fillRule="evenodd" />
      <path d="M1623 1423 1814.5 1011 2006 1423Z" fill="#FF0000" fillRule="evenodd" />
      <path
        d="M1787 1217 1842 1217 1910 1285 1910 1285 1842 1353 1787 1353 1719 1285 1719 1285Z"
        fill="#0B3041"
        fillRule="evenodd"
      />
      <path
        d="M1792 1230 1837 1230 1892 1285 1892 1285 1837 1340 1792 1340 1737 1285 1737 1285Z"
        fill="#FFFFFF"
        fillRule="evenodd"
      />
      <path
        d="M1794.5 1236 1834.5 1236 1883 1284.5 1883 1284.5 1834.5 1333 1794.5 1333 1746 1284.5 1746 1284.5Z"
        fill="#0B3041"
        fillRule="evenodd"
      />
    </g>
  </svg>
);

export const MountainDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    {/* Secondary duotone fill */}
    <path
      d="M3 19L9.5 7.5L14 15.5L16.5 11.5L21 19H3Z"
      fill="currentColor"
      fillOpacity="0.25"
    />
    {/* Primary crisp lines */}
    <path
      d="M2.5 19H21.5M9.5 7.5L3 19M9.5 7.5L14 15.5M16.5 11.5L21 19M16.5 11.5L14 15.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 13L8 16.5M15 14L17 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

export const WaterDropDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M12 2.5C12 2.5 5.5 10.5 5.5 15.5C5.5 19.0899 8.41015 22 12 22C15.5899 22 18.5 19.0899 18.5 15.5C18.5 10.5 12 2.5 12 2.5Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 14C14.5 16 13.5 18 11.5 18.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

export const WaveDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M2 13C4 11 6 11 8 13C10 15 12 15 14 13C16 11 18 11 20 13C21 14 21.5 14.5 22 15V19C21.5 19.5 21 20 20 19C18 17 16 17 14 19C12 21 10 21 8 19C6 17 4 17 2 19V13Z"
      fill="currentColor"
      fillOpacity="0.25"
    />
    <path
      d="M2 9C4 7 6 7 8 9C10 11 12 11 14 9C16 7 18 7 20 9C21 10 21.5 10.5 22 11M2 15C4 13 6 13 8 15C10 17 12 17 14 15C16 13 18 13 20 15C21 16 21.5 16.5 22 17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FlameDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M12 2C12 2 15.5 5 15.5 9.5C15.5 10.5 15 11.5 14.5 12C15.5 11 17 9.5 17 7.5C19.5 9.5 20.5 12.5 20.5 15C20.5 19.1421 16.6944 22 12 22C7.30558 22 3.5 19.1421 3.5 15C3.5 11 6.5 6 12 2Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15C10.5 15 9.5 16.5 9.5 18C9.5 19.5 10.6 20.5 12 20.5C13.4 20.5 14.5 19.5 14.5 18C14.5 16.5 13.5 15 12 15Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const LayersDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12M2 17L12 22L22 17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BrushDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M14.5 3.5L20.5 9.5L16.5 13.5L10.5 7.5L14.5 3.5Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 7.5L4 14C3 15 2 17.5 2 19.5C2 21 3 22 4.5 22C6.5 22 9 21 10 20L16.5 13.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 19.5C5.5 19.5 6 18.5 6.5 17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const PaletteDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C13.5 22 14.5 21 14.5 19.5C14.5 18.8 14.2 18.2 13.8 17.7C13.4 17.2 13.1 16.6 13.1 16C13.1 14.9 14 14 15.1 14H17C19.76 14 22 11.76 22 9C22 5.13 17.52 2 12 2Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6.5" cy="11.5" r="1.5" fill="currentColor" />
    <circle cx="9.5" cy="7.5" r="1.5" fill="currentColor" />
    <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" />
    <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" />
  </svg>
);

export const ExportDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M4 14V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V14"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M12 3V15M12 3L7.5 7.5M12 3L16.5 7.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PlayDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
    <polygon points="10,8 16,12 10,16" fill="currentColor" />
  </svg>
);

export const StepForwardDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M4 6.5L14 12L4 17.5V6.5Z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M19 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const RefreshDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M19.9 10C19.3 6.1 16 3 12 3C7.6 3 4 6.6 4 11C4 13.2 4.9 15.2 6.3 16.7L3.5 19.5H10V13L7.8 15.2C6.7 14.1 6 12.6 6 11C6 7.7 8.7 5 12 5C14.9 5 17.3 7.1 17.9 10H19.9Z"
      fill="currentColor"
      fillOpacity="0.25"
    />
    <path
      d="M20 4V10H14M4 20V14H10M20 10C19.3 6.1 16 3 12 3C7.6 3 4 6.6 4 11C4 13.2 4.9 15.2 6.3 16.7M4 14C4.7 17.9 8 21 12 21C16.4 21 20 17.4 20 13C20 10.8 19.1 8.8 17.7 7.3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SunDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2V4M12 20V22M4 12H2M22 12H20M5.64 5.64L7.05 7.05M16.95 16.95L18.36 18.36M5.64 18.36L7.05 16.95M16.95 7.05L18.36 5.64"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const GridDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 9H21M3 15H21M9 3V21M15 3V21" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
  </svg>
);

export const SliderDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M4 6H14M18 6H20M4 12H8M12 12H20M4 18H16M20 18H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="16" cy="6" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="10" cy="12" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="18" cy="18" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const GodotDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M12 4C6.5 4 4 6 4 11C4 16 6 19 12 19C18 19 20 16 20 11C20 6 17.5 4 12 4Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="9" cy="11" r="1.5" fill="currentColor" />
    <circle cx="15" cy="11" r="1.5" fill="currentColor" />
    <path d="M10 15H14M7 3L8.5 5M17 3L15.5 5M2 11H4M20 11H22M6 19L5 21M18 19L19 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const UnrealDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M8 8V12.5C8 14.5 9.5 16 12 16C14.5 16 16 14.5 16 12.5V8M6 8H10M14 8H18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Cube3DDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M12 2V12M12 12L20.5 7M12 12L3.5 7M12 12V22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckCircleDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 12.5L11 15.5L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DownloadDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M4 16V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V16"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M12 3V15M12 15L7.5 10.5M12 15L16.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MaximizeDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M3 9V5C3 3.89543 3.89543 3 5 3H9M15 3H19C20.1046 3 21 3.89543 21 5V9M21 15V19C21 20.1046 20.1046 21 19 21H15M9 21H5C3.89543 21 3 20.1046 3 19V15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const SparklesDuotone: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M12 2L14.2 8.5L21 9.5L16 14L17.5 21L12 17.5L6.5 21L8 14L3 9.5L9.8 8.5L12 2Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronDownDuotone: React.FC<IconProps> = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseDuotone: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.2" />
    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InfoCircleDuotone: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8V8.01M12 11V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
