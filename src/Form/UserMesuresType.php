<?php

namespace App\Form;

use App\Entity\UserMesures;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\NumberType;

class UserMesuresType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('polluant', ChoiceType::class, [
                'choices'  => [
                    'NO2' => 'NO2',
                    'O3' => 'O3',
                    'PM10' => 'PM10',
                    'PM25' => 'PM25',
                    'SO2' => 'SO2'
                ],
            ])
            ->add('date', DateType::class)
            ->add('lon', NumberType::class, [
                'invalid_message' => 'Longitude',
            ])
            ->add('lat', NumberType::class, [
                'invalid_message' => 'Latitude',
            ])
            ->add('file_adress', FileType::class)
        ;
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => UserMesures::class,
        ]);
    }
}
