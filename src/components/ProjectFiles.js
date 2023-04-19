import React from 'react';
import Files from '@/components/Files';
import Projects from '@/components/Projects';

const ProjectFiles = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <fieldset style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem' }}>
        <legend style={{ fontWeight: 'bold', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>Projects</legend>
        <div>
          <Projects />
        </div>
      </fieldset>
      <fieldset style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px' }}>
        <legend style={{ fontWeight: 'bold', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>Files</legend>
        <div>
          <Files />
        </div>
      </fieldset>
    </div>
  );
};

export default ProjectFiles;
