"use client"

import * as React from "react"
import { HelpCircle, Smartphone, Apple, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * 전화번호부 일괄 가져오기 사용 가이드 모달.
 * - 안드로이드 / 아이폰 / 데스크톱 3개 탭
 * - ContactsImport 옆 "?" 아이콘으로 트리거
 */
export function ContactsImportGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground h-7 px-2"
          aria-label="전화번호부 가져오는 방법"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="text-[11px]">어떻게 가져오나요?</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>전화번호부 가져오기</DialogTitle>
          <DialogDescription>
            기기에 따라 방법이 달라요. 본인 환경에 맞는 탭을 선택해 주세요.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="android" className="mt-2">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="android" className="gap-1 py-2">
              <Smartphone className="h-3.5 w-3.5" />
              안드로이드
            </TabsTrigger>
            <TabsTrigger value="ios" className="gap-1 py-2">
              <Apple className="h-3.5 w-3.5" />
              아이폰
            </TabsTrigger>
            <TabsTrigger value="desktop" className="gap-1 py-2">
              <Monitor className="h-3.5 w-3.5" />
              PC
            </TabsTrigger>
          </TabsList>

          {/* ===== ANDROID ===== */}
          <TabsContent value="android" className="space-y-4 text-sm">
            <Section
              badge="권장"
              tone="primary"
              title="Chrome 브라우저로 — 가장 쉬워요"
            >
              <Step n={1}>
                <strong>Chrome</strong>으로 이 앱 열기 (삼성 인터넷·카톡 인앱 브라우저는 미지원)
              </Step>
              <Step n={2}>
                위 <Kbd>전화번호부에서 가져오기</Kbd> 버튼 누르기
              </Step>
              <Step n={3}>
                권한 팝업이 뜨면 <Kbd>허용</Kbd>
              </Step>
              <Step n={4}>
                시스템 연락처 picker에서 원하는 친구들 <strong>다중 선택</strong>
              </Step>
              <Step n={5}>
                <Kbd>완료</Kbd> 누르면 자동 일괄 등록
              </Step>
            </Section>

            <Section title="삼성 인터넷·카톡 브라우저 등에서">
              <p className="text-[11px] text-muted-foreground mb-2">
                Picker가 안 보이면 <strong>vCard(.vcf) 파일 업로드</strong>로 가져올 수 있어요.
              </p>
              <Step n={1}>
                <strong>연락처</strong> 앱 → 우상단 <Kbd>⋮</Kbd> → <Kbd>연락처 관리</Kbd>
              </Step>
              <Step n={2}>
                <Kbd>가져오기/내보내기</Kbd> → <Kbd>연락처 내보내기</Kbd>
              </Step>
              <Step n={3}>
                저장 위치: <Kbd>내장 메모리</Kbd> → 보통 <code>Contacts.vcf</code>로 저장
              </Step>
              <Step n={4}>
                관계부 앱에서 <Kbd>.vcf 파일 가져오기</Kbd> → 그 파일 선택
              </Step>
            </Section>
          </TabsContent>

          {/* ===== iOS ===== */}
          <TabsContent value="ios" className="space-y-4 text-sm">
            <p className="rounded-md bg-warning/10 px-2 py-1.5 text-[11px] text-warning">
              iOS Safari는 시스템 연락처에 직접 접근이 막혀있어요. <strong>vCard(.vcf) 파일 업로드</strong>로 가져와야 해요.
            </p>

            <Section
              badge="권장"
              tone="primary"
              title="iCloud.com에서 한 번에 (전체 일괄)"
            >
              <Step n={1}>
                PC/Mac 브라우저로{" "}
                <a
                  href="https://www.icloud.com/contacts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  icloud.com/contacts
                </a>{" "}
                접속 → 로그인
              </Step>
              <Step n={2}>
                연락처 목록에서 <Kbd>Cmd+A</Kbd> / <Kbd>Ctrl+A</Kbd>로 전체 선택
              </Step>
              <Step n={3}>
                좌하단 <Kbd>⚙️</Kbd> → <Kbd>vCard 보내기...</Kbd> → <code>.vcf</code> 파일 다운로드
              </Step>
              <Step n={4}>
                그 파일을 아이폰으로 전송 (AirDrop / 본인 메일 / iCloud Drive)
              </Step>
              <Step n={5}>
                아이폰 Safari에서 관계부 앱 → <Kbd>.vcf 파일 가져오기</Kbd> → 파일 선택
              </Step>
            </Section>

            <Section title="아이폰만으로 (소수만 가져올 때)">
              <Step n={1}>
                <strong>연락처</strong> 앱 → 친구 카드 열기
              </Step>
              <Step n={2}>
                맨 아래 <Kbd>연락처 공유</Kbd> → <Kbd>파일에 저장</Kbd>
              </Step>
              <Step n={3}>
                관계부 앱에서 <Kbd>.vcf 파일 가져오기</Kbd> → 파일 앱에서 그 카드 선택
              </Step>
              <p className="text-[11px] text-muted-foreground">
                iOS 17 이상에서는 다중 선택 후 한 번에 vcf로 묶어 공유할 수 있어요.
              </p>
            </Section>
          </TabsContent>

          {/* ===== DESKTOP ===== */}
          <TabsContent value="desktop" className="space-y-4 text-sm">
            <Section title="Mac 연락처 앱">
              <Step n={1}>
                연락처 앱 열고 좌측에서 <Kbd>모든 연락처</Kbd> 선택
              </Step>
              <Step n={2}>
                <Kbd>Cmd+A</Kbd>로 전체 선택
              </Step>
              <Step n={3}>
                메뉴 <Kbd>파일</Kbd> → <Kbd>내보내기</Kbd> → <Kbd>vCard 내보내기...</Kbd>
              </Step>
              <Step n={4}>
                아이폰/안드로이드로 파일 전송 후 <Kbd>.vcf 파일 가져오기</Kbd>
              </Step>
            </Section>

            <Section title="Google 연락처 (구글 계정 사용 시)">
              <Step n={1}>
                <a
                  href="https://contacts.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  contacts.google.com
                </a>{" "}
                접속
              </Step>
              <Step n={2}>
                좌측 메뉴 <Kbd>내보내기</Kbd> → <Kbd>vCard (iOS 연락처용)</Kbd> 선택
              </Step>
              <Step n={3}>
                다운받은 <code>contacts.vcf</code>를 <Kbd>.vcf 파일 가져오기</Kbd>로 업로드
              </Step>
            </Section>

            <Section title="Outlook">
              <Step n={1}>
                Outlook → <Kbd>People</Kbd> → 연락처 선택 → <Kbd>Save as vCard</Kbd>
              </Step>
              <Step n={2}>
                다중 선택 시 .vcf 파일이 폴더로 묶여 나오므로 zip 해제 후 한 파일씩 업로드 (또는 텍스트 에디터로 합치기)
              </Step>
            </Section>
          </TabsContent>
        </Tabs>

        <p className="mt-3 rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground">
          💡 이름이 같은 사람은 자동으로 건너뛰어요. 휴대폰 번호와 이메일은 인물의 메모란에 들어가니, 등록 후 인물 편집에서 옮겨주세요.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function Section({
  title,
  badge,
  tone,
  children,
}: {
  title: string
  badge?: string
  tone?: "primary"
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        {badge ? (
          <span
            className={
              tone === "primary"
                ? "rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                : "rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
            }
          >
            {badge}
          </span>
        ) : null}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ol className="space-y-1.5">{children}</ol>
    </section>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[13px] leading-relaxed">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
        {n}
      </span>
      <span className="flex-1 text-foreground/90">{children}</span>
    </li>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium font-mono">
      {children}
    </kbd>
  )
}
