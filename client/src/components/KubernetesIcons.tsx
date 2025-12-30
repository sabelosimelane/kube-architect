import React from 'react';

interface IconProps {
  className?: string;
}

export const K8sDeploymentIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.001 2L3 7V17L12.001 22L21 17V7L12.001 2ZM12.001 15.5C10.0675 15.5 8.501 13.933 8.501 12C8.501 10.067 10.0675 8.5 12.001 8.5C13.9345 8.5 15.501 10.067 15.501 12C15.501 13.933 13.9345 15.5 12.001 15.5Z" fill="currentColor"/>
  </svg>
);

export const K8sNamespaceIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.19L19.36 7.97L12 11.75L4.64 7.97L12 4.19ZM4 16.02V9.24L11 12.86V20.02L4 16.02ZM13 20.02V12.86L20 9.24V16.02L13 20.02Z" fill="currentColor"/>
  </svg>
);

export const K8sConfigMapIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM9 6H11V10H9V6ZM13 6H15V10H13V6ZM4 18V6H7V12H17V6H20V18H4Z" fill="currentColor"/>
  </svg>
);

export const K8sSecretIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9V6ZM18 20H6V10H18V20ZM12 17C13.1 17 14 16.1 14 15C14 13.9 13.1 13 12 13C10.9 13 10 13.9 10 15C10 16.1 10.9 17 12 17Z" fill="currentColor"/>
  </svg>
);

export const K8sJobIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
  </svg>
);

export const K8sCronJobIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20ZM12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="currentColor"/>
  </svg>
);

export const K8sStorageIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 20H22V16H2V20ZM4 17H6V19H4V17ZM2 4V8H22V4H2ZM6 7H4V5H6V7ZM2 14H22V10H2V14ZM4 11H6V13H4V11Z" fill="currentColor"/>
  </svg>
);

export const K8sDaemonSetIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="currentColor"/>
  </svg>
);

export const K8sPodIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L4 6V18L12 22L20 18V6L12 2ZM12 4.21L17.37 7L12 9.83L6.63 7L12 4.21ZM6 16.89L5 16.35V8.17L11 11.15V19.29L6 16.89ZM13 19.29V11.15L19 8.17V16.35L18 16.89L13 19.29Z" fill="currentColor"/>
  </svg>
);

export const K8sSecurityIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V16H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z" fill="currentColor"/>
  </svg>
);

export const K8sServiceAccountIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5C14.8 4.1 13.9 2.9 12.6 2.2L11.2 5.6C11.5 5.8 11.7 6.1 11.8 6.5L17.5 7.5C17.3 7.2 17.1 6.9 16.8 6.7L21 9ZM3 9L7.2 6.7C6.9 6.9 6.7 7.2 6.5 7.5L12.2 6.5C12.3 6.1 12.5 5.8 12.8 5.6L11.4 2.2C10.1 2.9 9.2 4.1 9 5.5L3 7V9ZM9 13C9 15.8 11.2 18 14 18S19 15.8 19 13V11H17V13C17 14.7 15.7 16 14 16S11 14.7 11 13V11H9V13ZM5 13C5 15.8 7.2 18 10 18S15 15.8 15 13V11H13V13C13 14.7 11.7 16 10 16S7 14.7 7 13V11H5V13Z" fill="currentColor"/>
  </svg>
); 