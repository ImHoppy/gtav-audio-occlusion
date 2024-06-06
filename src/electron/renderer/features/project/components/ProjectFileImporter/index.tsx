import React from 'react';

import { isXMLFilePath, isMapDataFilePath, isMapTypesFilePath } from '@/electron/common/utils/files';

import { useProject } from '../../context';

import { FileImporter } from '../FileImporter';

export const ProjectFileImporter: React.FC = () => {
  const { setCreateModalMapDataFile, setCreateModalMapTypesFile, setCreateModalOpen, importProject } = useProject();

  const validateFile = (file: File): boolean => isXMLFilePath(file.path);

  const onFileImport = (files: File[]): void => {
    let importedFile = false;

    files.forEach(file => {
      if (isMapDataFilePath(file.path)) {
        importedFile = true;

        return setCreateModalMapDataFile(file.path);
      }

      if (isMapTypesFilePath(file.path)) {
        importedFile = true;

        return setCreateModalMapTypesFile(file.path);
      }
    });

    if (importedFile) {
      setCreateModalOpen(true);
    }
  };

  const onButtonClick = (): void => {
    setCreateModalOpen(true);
  };

  const openProject = (file: File): void => {
    importProject(file);
  };

  return (
    <FileImporter
      validateFile={validateFile}
      onFileImport={onFileImport}
      onButtonClick={onButtonClick}
      openProject={openProject}
    />
  );
};
