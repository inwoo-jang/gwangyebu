import * as React from "react"
import { cn } from "@/lib/utils"
import {
  type Gender,
  DEFAULT_AVATAR_BG,
  DEFAULT_GENDER,
  DEFAULT_PROFILE_INDEX,
  pastelBgStyle,
  profileImageUrl,
} from "@/lib/profile/avatar"

const sizeClass = {
  xs: "h-7 w-7",
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
} as const

export type ProfileAvatarSize = keyof typeof sizeClass

interface ProfileAvatarProps {
  gender?: Gender | null
  profileIndex?: number | null
  bgId?: number | null
  name?: string
  size?: ProfileAvatarSize
  className?: string
}

export function ProfileAvatar({
  gender,
  profileIndex,
  bgId,
  name,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const g = gender ?? DEFAULT_GENDER
  const idx = profileIndex ?? DEFAULT_PROFILE_INDEX
  const bg = bgId ?? DEFAULT_AVATAR_BG
  return (
    <div
      className={cn(
        "shrink-0 rounded-full overflow-hidden grid place-items-center",
        sizeClass[size],
        className,
      )}
      style={pastelBgStyle(bg)}
      aria-label={name ? `${name} 프로필 사진` : "프로필 사진"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={profileImageUrl(g, idx)}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
