import React, { useState, DragEvent, FC } from 'react';
import { FaFileImport } from 'react-icons/fa';

import { Container, Button, CallToAction, Description } from './styles';

type FileImporterProps = {
  validateFile?: (files: File) => boolean;
  onFileImport?: (files: File[]) => void;
  onButtonClick?: () => void;
  openProject?: (file: File) => void;
};

export const FileImporter: FC<FileImporterProps> = ({ validateFile, onFileImport, onButtonClick, openProject }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(0);

  const dragOver = (event: DragEvent): void => {
    event.preventDefault();
  };

  const dragEnter = (event: DragEvent): void => {
    event.preventDefault();

    setIsDraggingOver(value => value + 1);
  };

  const dragLeave = (event: DragEvent): void => {
    event.preventDefault();

    setIsDraggingOver(value => value - 1);
  };

  const dragDrop = (event: DragEvent): void => {
    event.preventDefault();

    const files = event.dataTransfer.files;

    if (files.length == 1 && files[0].path.endsWith('.json')) {
      if (openProject) openProject(files[0]);
      setIsDraggingOver(0);
      return;
    }

    if (files.length && onFileImport) {
      const fileList: File[] = [];

      for (let i = 0; i < files.length; i++) {
        if (validateFile && !validateFile(files[i])) continue;

        fileList.push(files[i]);
      }

      onFileImport(fileList);
    }

    setIsDraggingOver(0);
  };

  return (
    <Container
      isDraggingOver={!!isDraggingOver}
      onDragOver={dragOver}
      onDragEnter={dragEnter}
      onDragLeave={dragLeave}
      onDrop={dragDrop}
    >
      <Button onClick={onButtonClick}>
        <FaFileImport size={60} />
      </Button>
      <CallToAction>Create new project</CallToAction>
      <Description>or drag #map and #typ CodeWalker XML files</Description>
      <CallToAction>Or drag to import project</CallToAction>
      <Description>from a json file</Description>
    </Container>
  );
};
