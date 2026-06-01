interface Props { light?: boolean; size?: number }

export function Logo({ light = false, size = 44 }: Props) {
  const src = light ? '/telos-logo-offwhite.png' : '/telos-logo.png'
  return <img src={src} alt="Telos Wealth" style={{ height: size, width: 'auto', display: 'block' }} />
}
