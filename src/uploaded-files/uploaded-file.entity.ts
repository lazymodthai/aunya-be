import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../users/users.entity';

@Entity('uploaded_files')
export class UploadedFileEntity {
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

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'uploaderId' })
  uploader: UserEntity;

  @Column()
  uploaderId: number;

  @Column()
  uploadedAt: Date;

  @Column({ nullable: true }) // invoiceNumber can be optional
  invoiceNumber: string;
}
