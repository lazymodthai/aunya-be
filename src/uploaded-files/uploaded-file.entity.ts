import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity('uploaded_files')
export class UploadedFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  s3Key: string;

  @Column()
  fileName: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaderId' })
  uploader: User;

  @Column()
  uploaderId: number;

  @Column()
  uploadedAt: Date;

  @Column({ nullable: true }) // invoiceNumber can be optional
  invoiceNumber: string;
}
