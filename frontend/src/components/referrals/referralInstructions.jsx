import React from 'react';
import Card from '../common/Card';

const ReferralInstructions = () => {
  return (
    <Card title="How to Create a Referral" className="mb-6">
      <div className="space-y-4">
        <p className="text-gray-700">
          As a professional on MentorConnect, you can earn rewards by referring candidates to colleagues at your company.
          For a referral to be valid and generate a reward:
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Important:</strong> You must send the referral email to a colleague with the same company email domain as yours, and CC our platform at <strong>referrals@mentorconnect.com</strong>
              </p>
            </div>
          </div>
        </div>
        
        <h3 className="font-medium text-gray-900 mt-4">Follow these steps:</h3>
        
        <ol className="list-decimal pl-5 space-y-2">
          <li className="text-gray-700">
            <span className="font-medium">Create a connection with a candidate</span> through a networking session.
          </li>
          <li className="text-gray-700">
            <span className="font-medium">Send an email to a colleague</span> at your same company (same email domain).
          </li>
          <li className="text-gray-700">
            <span className="font-medium">CC our platform email</span> at <span className="text-blue-600">referrals@mentorconnect.com</span> in your email.
          </li>
          <li className="text-gray-700">
            <span className="font-medium">Mention the candidate</span> you're referring in the email body.
          </li>
        </ol>
        
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Email Template Example:</h4>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-gray-700 mb-2">
              <strong>To:</strong> colleague@yourcompany.com<br />
              <strong>CC:</strong> referrals@mentorconnect.com<br />
              <strong>Subject:</strong> Candidate Referral - [Candidate Name]
            </p>
            <p className="text-gray-700 whitespace-pre-line">
              Hi [Colleague Name],
              
              I recently had a networking session with [Candidate Name] through MentorConnect, and I believe they would be a great fit for the [Position] role at our company.
              
              [Candidate Name]'s email is [candidate@email.com]. They have experience in [relevant skills/experience] and showed strong interest in [department/area].
              
              Would you be able to help connect them with the appropriate team or hiring manager?
              
              Thanks,
              [Your Name]
            </p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Referral rewards are only processed after our system verifies that:
                <ul className="list-disc pl-5 mt-1">
                  <li>The email was sent to a colleague with the same email domain as yours</li>
                  <li>Our platform email was CC'd on the email</li>
                  <li>The candidate was mentioned in the email</li>
                </ul>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReferralInstructions;