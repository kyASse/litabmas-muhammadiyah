import Wizard, { LecturerItem, SchemaItem } from './Wizard';

interface CreateProps {
    schemas?: SchemaItem[];
    lecturers?: LecturerItem[];
}

export default function Create({ schemas = [], lecturers = [] }: CreateProps) {
    return <Wizard schemas={schemas} lecturers={lecturers} />;
}
