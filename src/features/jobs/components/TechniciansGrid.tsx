import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { TeamMember } from '../../settings/teamMembers/types'
import {
  DAY_WIDTH_PX,
  HEADER_HEIGHT,
  INITIAL_SCROLL_HOUR,
  MINUTES_PER_DAY,
  NAME_COLUMN_WIDTH,
  PX_PER_MINUTE,
  ROW_HEIGHT,
  SLOT_MINUTES,
  SNAP_MINUTES,
} from '../gridConstants'
import type { Job } from '../types'
import { TIMELINE_ATTRIBUTE, technicianDisplayName } from '../technicianUtils'
import { minutesToLabel, offsetXToMinutes, snapMinutes } from '../../../utils/timeGrid'
import { JobCard } from './JobCard'

interface HoverState {
  technicianId: string
  minutes: number
}

interface PopoverState {
  technicianId: string
  technicianName: string
  minutes: number
  top: number
  left: number
}

export interface DropPlaceholder {
  technicianId: string
  minutes: number
  durationMinutes: number
}

interface TechniciansGridProps {
  technicians: TeamMember[]
  jobs: Job[]
  /** Where the dragged job will land if dropped now; rendered underneath the drag overlay. */
  dropPlaceholder: DropPlaceholder | null
  onAddJob: (params: { technicianId: string; technicianName: string; minutes: number }) => void
  onEditJob: (job: Job) => void
  onDeleteJob: (job: Job) => void
}

const slotTicks = Array.from({ length: MINUTES_PER_DAY / SLOT_MINUTES }, (_, i) => i * SLOT_MINUTES)

interface TimelineDropRowProps {
  technicianId: string
  children: ReactNode
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void
  onMouseLeave: () => void
  onClick: (event: ReactMouseEvent<HTMLDivElement>) => void
}

function TimelineDropRow({ technicianId, children, onMouseMove, onMouseLeave, onClick }: TimelineDropRowProps) {
  const { setNodeRef } = useDroppable({ id: technicianId })

  return (
    <Box
      ref={setNodeRef}
      {...{ [TIMELINE_ATTRIBUTE]: technicianId }}
      sx={{
        width: DAY_WIDTH_PX,
        height: ROW_HEIGHT,
        position: 'relative',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundImage: (theme) =>
          `repeating-linear-gradient(to right, transparent 0, transparent ${SLOT_MINUTES * PX_PER_MINUTE - 1}px, ${theme.palette.divider} ${SLOT_MINUTES * PX_PER_MINUTE - 1}px, ${theme.palette.divider} ${SLOT_MINUTES * PX_PER_MINUTE}px)`,
        cursor: 'pointer',
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {children}
    </Box>
  )
}

export function TechniciansGrid({
  technicians,
  jobs,
  dropPlaceholder,
  onAddJob,
  onEditJob,
  onDeleteJob,
}: TechniciansGridProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState | null>(null)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const isDragging = useDndContext().active !== null

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = INITIAL_SCROLL_HOUR * 60 * PX_PER_MINUTE
    }
  }, [])

  function handleMouseMove(event: ReactMouseEvent<HTMLDivElement>, technicianId: string) {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const minutes = snapMinutes(offsetXToMinutes(offsetX, PX_PER_MINUTE), SNAP_MINUTES, MINUTES_PER_DAY)
    setHover({ technicianId, minutes })
  }

  function handleMouseLeave() {
    setHover(null)
  }

  function handleClick(event: ReactMouseEvent<HTMLDivElement>, technician: TeamMember) {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const minutes = snapMinutes(offsetXToMinutes(offsetX, PX_PER_MINUTE), SNAP_MINUTES, MINUTES_PER_DAY)
    setPopover({
      technicianId: technician.id,
      technicianName: technicianDisplayName(technician),
      minutes,
      top: event.clientY,
      left: event.clientX,
    })
  }

  function handlePopoverClose() {
    setPopover(null)
  }

  function handleAddJobClick() {
    if (!popover) {
      return
    }
    onAddJob({ technicianId: popover.technicianId, technicianName: popover.technicianName, minutes: popover.minutes })
    setPopover(null)
  }

  return (
    <Box
      ref={scrollRef}
      sx={{
        overflow: 'auto',
        maxHeight: 'calc(100vh - 260px)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', width: NAME_COLUMN_WIDTH + DAY_WIDTH_PX }}>
        <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3 }}>
          <Box
            sx={{
              width: NAME_COLUMN_WIDTH,
              flexShrink: 0,
              position: 'sticky',
              left: 0,
              zIndex: 4,
              height: HEADER_HEIGHT,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          />
          <Box
            sx={{
              width: DAY_WIDTH_PX,
              height: HEADER_HEIGHT,
              position: 'relative',
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {slotTicks.map((minutes) => (
              <Typography
                key={minutes}
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: minutes * PX_PER_MINUTE + 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary',
                }}
              >
                {minutesToLabel(minutes)}
              </Typography>
            ))}
          </Box>
        </Box>

        {technicians.length === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('jobs.noTechnicians')}
            </Typography>
          </Box>
        )}

        {technicians.map((technician) => {
          const technicianJobs = jobs.filter((job) => job.assignedUserId === technician.id)
          const isHovered = !isDragging && hover?.technicianId === technician.id

          return (
            <Box key={technician.id} sx={{ display: 'flex' }}>
              <Box
                sx={{
                  width: NAME_COLUMN_WIDTH,
                  flexShrink: 0,
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  height: ROW_HEIGHT,
                  bgcolor: 'background.paper',
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                }}
              >
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {technicianDisplayName(technician)}
                </Typography>
              </Box>

              <TimelineDropRow
                technicianId={technician.id}
                onMouseMove={(event) => handleMouseMove(event, technician.id)}
                onMouseLeave={handleMouseLeave}
                onClick={(event) => handleClick(event, technician)}
              >
                {technicianJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onEdit={onEditJob}
                    onDelete={onDeleteJob}
                    onHoverStart={() => setHover(null)}
                  />
                ))}

                {dropPlaceholder?.technicianId === technician.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: dropPlaceholder.minutes * PX_PER_MINUTE,
                      width: Math.max(dropPlaceholder.durationMinutes * PX_PER_MINUTE, 8),
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                      borderLeft: '2px solid',
                      borderColor: 'primary.main',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* At the bottom so it doesn't sit under the drag overlay's text. */}
                    <Typography
                      variant="caption"
                      sx={{ position: 'absolute', bottom: 0, left: 0, px: '4px', color: 'primary.dark', fontWeight: 600 }}
                    >
                      {minutesToLabel(dropPlaceholder.minutes)}
                    </Typography>
                  </Box>
                )}

                {isHovered && hover && (
                  <>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: hover.minutes * PX_PER_MINUTE,
                        width: '2px',
                        bgcolor: 'primary.main',
                        pointerEvents: 'none',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: hover.minutes * PX_PER_MINUTE,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 2,
                        left: hover.minutes * PX_PER_MINUTE + 6,
                        px: '4px',
                        borderRadius: '6px',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        pointerEvents: 'none',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'inherit' }}>
                        {minutesToLabel(hover.minutes)}
                      </Typography>
                    </Box>
                  </>
                )}
              </TimelineDropRow>
            </Box>
          )
        })}
      </Box>

      <Popover
        open={!!popover}
        onClose={handlePopoverClose}
        anchorReference="anchorPosition"
        anchorPosition={popover ? { top: popover.top, left: popover.left } : undefined}
      >
        <Button variant="text" onClick={handleAddJobClick} sx={{ m: 1 }}>
          {t('jobs.addJobPopup.addJobToOrder')}
        </Button>
      </Popover>
    </Box>
  )
}
