import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource

def generate_launch_description():
    pkg_nav = get_package_share_directory('runway_navigation')
    bringup_launch = os.path.join(pkg_nav, 'launch', 'bringup_nav2.launch.py')

    return LaunchDescription([
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(bringup_launch),
            launch_arguments={'world_name': 'nus_ea_field'}.items()
        )
    ])
