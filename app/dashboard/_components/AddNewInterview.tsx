"use client"
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { chatSession } from '@/utils/GeminiAIModel'
import { LoaderCircle } from 'lucide-react'
import { MockInterview } from '@/utils/schema'
import { db } from '@/utils/db'
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/nextjs'
import moment from 'moment'
import { useRouter } from 'next/navigation';

function AddNewInterview() {
  const [openDialog, setOpenDialog] = useState(false)
  const [jobPosition, setjobPosition] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [jobExperience, setjobExperience] = useState('')
  const [loading, setLoading] = useState(false);
  const [jsonResponse, setJsonResponse] = useState([]);
  const router = useRouter();
  const { user } = useUser();
  const onSubmit = async (e: { preventDefault: () => void; currentTarget: any }) => {
    setLoading(true);
    e.preventDefault()
    const form = e.currentTarget

    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    const InputPrompt = "Job position:" + jobPosition + " Job Description:" + jobDesc + "Years of Experience:" + jobExperience + "Depends on Job Position, Job Description & Years of Experience give us" + process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT + "Interview question along with Answer in JSON format, Give us question and answer field on JSON";
    const result = await chatSession.sendMessage(InputPrompt);
    const MockJsonResp = (result.response.text()).replace('```json', '').replace('```', '');
    setJsonResponse(MockJsonResp);



    if (MockJsonResp) {
      const resp = await db.insert(MockInterview).values({
        mockId: uuidv4(),
        jsonMockResp: MockJsonResp,
        jobPosition: jobPosition,
        jobDesc: jobDesc,
        jobExperience: jobExperience,
        createdBy: user?.primaryEmailAddress?.emailAddress || '',
        createdAt: moment().format('DD-MM-yyyy')
      }).returning({ mockId: MockInterview.mockId })

      console.log("Inserted ID:", resp);
      if (resp) {
        setOpenDialog(false);
        router.push('/dashboard/interview/' + resp[0]?.mockId)
      }
    }
    else {
      console.log("Error", e);
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        className='p-6 border rounded-lg bg-secondary hover:scale-105 hover:shadow-sm cursor-pointer transition-all w-full'
        onClick={() => setOpenDialog(true)}
        role="button"
        aria-label="Add New Interview"
      >
        <h2 className='text-lg text-center'>+ Add New</h2>
      </button>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className='max-w-2xl'>
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle className='text-2xl'>
                Tell us more about your job interview
              </DialogTitle>
              <DialogDescription>
                Add details about your job position, role, job description, and years of experience.

                <span className="block mt-7 my-3">
                  <label>Job Role/Job Position</label>
                  <Input
                    placeholder='Ex. Full Stack Developer'
                    value={jobPosition}
                    onChange={(e) => setjobPosition(e.target.value)}
                    required
                  />
                </span>

                <span className="block my-3">
                  <label>Job Description Tech Stack (In Short)</label>
                  <Textarea
                    placeholder='Ex. React, Angular, Node Js, MySQL, etc...'
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    required
                  />
                </span>

                <span className="block my-3">
                  <label>Years of Experience</label>
                  <Input
                    placeholder='5'
                    type="number"
                    value={jobExperience}
                    onChange={(e) => setjobExperience(e.target.value)}
                    max={50}
                    required
                  />
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className='flex gap-5 justify-end mt-4'>
              <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ?
                  <>
                    <LoaderCircle className='animate-spin' />'Generating Interview content'
                  </>
                  : 'Start Interview'
                }

              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddNewInterview
