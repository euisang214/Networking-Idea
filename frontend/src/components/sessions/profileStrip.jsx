import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../common/Modal";

const ProfileStrip = ({ user, role }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left flex justify-between items-center p-2 rounded-md hover:bg-gray-50"
      >
        <div>
          <p className="font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </p>
          {role === "professional" && (
            <>
              <p className="text-sm text-gray-500">{user.title}</p>
              <p className="text-sm text-gray-500">
                {user.company?.name || user.companyName}
              </p>
            </>
          )}
          {role === "candidate" && (
            <p className="text-sm text-gray-500">{user.email}</p>
          )}
        </div>
        <svg
          className="h-5 w-5 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M6 6L14 10L6 14V6Z" clipRule="evenodd" />
        </svg>
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`${user.firstName} ${user.lastName}`}
      >
        <div className="space-y-2">
          {role === "professional" && (
            <>
              <p className="text-sm text-gray-600">
                {user.title} at {user.company?.name || user.companyName}
              </p>
              {user.bio && (
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {user.bio}
                </p>
              )}
              {user.skills && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          {role === "candidate" && (
            <p className="text-sm text-gray-600">{user.email}</p>
          )}
        </div>
      </Modal>
    </>
  );
};

ProfileStrip.propTypes = {
  user: PropTypes.object.isRequired,
  role: PropTypes.oneOf(["professional", "candidate"]).isRequired,
};

export default ProfileStrip;
